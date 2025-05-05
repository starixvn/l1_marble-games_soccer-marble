import cron from "cron";
import {
  AppContainer,
  Event,
  Selection,
  GameSettings,
  MatchConfigType,
  RoundResultType,
  RoundSettlementResultType,
  DrawResultType,
  DrawSettlementResultType,
} from "../types";
import { IEventDetail } from "../models/event-details";
import { IRound } from "../models/rounds";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { MatchGeneratorService } from "../services/match-generator-service";
import { decrypt, encrypt } from "../helpers/crypto-helper";
import { logger } from "sc-common";

// Types
export type Round = {
  roundId: number;
  roundTime: number;
  homeTeam: string;
  awayTeam: string;
  numberOfDraws: number;
  matchConfig?: MatchConfigType;
  selections?: Record<string, Selection>[];
  odds?: Record<string, number>[];
  result?: RoundResultType;
  settlementResult?: RoundSettlementResultType;
};

// Main GameCron class
export class GameCron {
  private roundService: RoundService;
  private eventService: EventService;
  private matchGeneratorService: MatchGeneratorService;
  private round: Round;
  private event: Event;
  private lastRound?: IRound;
  private gameSettings: GameSettings;
  private eventDetails: IEventDetail[];
  private logService: typeof logger;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
    this.roundService = new RoundService(container);
    this.eventService = new EventService(container);
    this.matchGeneratorService = new MatchGeneratorService(container);

    this.round = {
      roundId: 0,
      roundTime: 0,
      homeTeam: "",
      awayTeam: "",
      numberOfDraws: this.gameSettings.gameTiming.timelines.length,
    };
    this.event = {} as Event;
    this.eventDetails = [];
  }

  private async initRoundId() {
    this.round.roundId = await this.roundService.initializeRoundId();
  }

  private async getLastRound() {
    const lastRound = await this.roundService.fetchLastRound(this.round.roundId);
    if (lastRound) {
      this.lastRound = lastRound;
    }
  }

  private async updateAllEventDetails(eventDetails: IEventDetail[]) {
    for (const eventDetail of eventDetails) {
      if (eventDetail._id) {
        await this.eventService.updateEventDetail(eventDetail, [
          "selections",
          "playlist",
          "goalInfo",
          "result",
          "hasResult",
        ]);
      }
    }
  }

  private async updateEventDetailsByTimeline(rawEventDetails: IEventDetail[], currentDate: Date) {
    rawEventDetails.forEach(async (eventDetail, drawIndex) => {
      if (!eventDetail._id) return;

      if (eventDetail.oddsAvailableTs < currentDate) {
        await this.updateOddsForDraw(drawIndex);
      }

      if (eventDetail.scheduleStartTs < currentDate) {
        await this.updateVideoInfoForDraw(drawIndex);
      }

      if (eventDetail.resultsAvailableTs < currentDate) {
        await this.updateResultForDraw(drawIndex);
      }
    });
  }

  private async handleUnfinishedEvents() {
    if (this.lastRound && !this.lastRound.ended) {
      this.logService.log("Handling unfinished events", "info");
      const currentDate = new Date();
      const eventDetails = this.lastRound.eventDetails as IEventDetail[];

      await this.updateRoundAndEventFromLastRound();
      await this.updateEventDetails();
      await this.updateEventDetailsByTimeline(eventDetails, currentDate);
    }
  }

  async start() {
    try {
      await this.initRoundId();
      await this.getLastRound();
      await this.handleUnfinishedEvents();
      this.startCron();
    } catch (error) {
      this.logService.logError(error);
    }
  }

  private startCron() {
    const job = new cron.CronJob(
      "* * * * * *",
      () => this.proceed().catch(this.logService.logError),
      () => {
        this.logService.logError("Game cron job unexpectedly stopped because some other tasks halt it.");
        job.start();
      }
    );

    job.start();
  }

  private async proceed() {
    const currentRoundTime = this.round.roundTime;
    console.log(currentRoundTime);
    const { timelines, wholeRound } = this.gameSettings.gameTiming;

    if (currentRoundTime === 0) {
      await this.startNewRound();
    }

    if (currentRoundTime > wholeRound) {
      await this.roundService.markRoundAsEnded(this.round.roundId);
      await this.roundService.updateRoundEventDetailResult(this.round.roundId, this.eventDetails);
      await this.startNewRound();
    }

    await this.processTimelines(timelines, currentRoundTime);
    this.round.roundTime++;
  }

  private async processTimelines(timelines: any[], currentRoundTime: number) {
    for (const [drawIndex, timeline] of timelines.entries()) {
      if (currentRoundTime === timeline.OddsAvailable) {
        await this.updateOddsForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ScheduleStart) {
        await this.updateVideoInfoForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable) {
        await this.updateResultForDraw(drawIndex);
      }
    }
  }

  private async startNewRound() {
    this.round.roundTime = 0;
    this.round.roundId++;

    const { homeTeam, awayTeam } = this.matchGeneratorService.createNewMatch();
    this.round.homeTeam = homeTeam;
    this.round.awayTeam = awayTeam;

    this.round.matchConfig = this.matchGeneratorService.createNewMatchConfig();

    this.round.result = this.matchGeneratorService.generateResult(this.round.matchConfig, this.gameSettings.numberOfVideos);

    const { odds, matchConfig, selections } = this.matchGeneratorService.generateRoundOddsAndUpdateMatchConfig(
      this.round.matchConfig,
      this.round.result.drawResults[0].result.goalSequence
    );

    this.round.odds = odds;
    this.round.matchConfig = matchConfig;
    this.round.selections = selections;

    this.round.settlementResult = this.matchGeneratorService.getSettlementResult(this.round.result, this.round.matchConfig);

    this.event = await this.eventService.createNewEvent(this.round);
    await this.updateEventDetails();
    await this.createNewRound();
  }

  private async updateEventDetails() {
    const eventDetails = this.event.eventDetails;

    eventDetails.forEach((eventDetail, drawIndex) => {
      eventDetail.selections = Object.values(this.round.selections![drawIndex]);
      eventDetail.playlist = this.round.result!.drawResults[drawIndex].playlist;
      eventDetail.goalInfo = this.round.result!.drawResults[drawIndex].goalInfo;
      eventDetail.hasResult = true;
      eventDetail.result = this.round.result!.drawResults[drawIndex].result;
      eventDetail.encryptedResult = encrypt(eventDetail.result);
    });

    this.eventDetails = eventDetails as IEventDetail[];
  }

  private async createNewRound() {
    try {
      const newRound = {
        eventID: this.event.eventID,
        eventNameAKey: this.event.eventNameAKey,
        eventNameBKey: this.event.eventNameBKey,
        gameId: this.gameSettings.gameId,
        scheduleStartTs: this.event.scheduleStartTs,
        scheduleEndTs: this.event.scheduleEndTs,
        eventDetails: this.eventDetails,
        roundId: this.round.roundId,
        ended: false,
        matchConfig: this.round.matchConfig,
      };

      await this.roundService.insertOrUpdateRound(newRound as any);
    } catch (error) {
      console.error(`Error creating new round: ${error}`);
      throw error;
    }
  }

  private async updateRoundAndEventFromLastRound() {
    const drawResults = this.lastRound!.eventDetails.map((eventDetail) => ({
      result: decrypt(eventDetail.encryptedResult) || "",
      playlist: eventDetail.playlist || "",
      goalInfo: eventDetail.goalInfo || "",
    })) as DrawResultType[];

    const settlementResult = this.matchGeneratorService.getSettlementResult({ drawResults }, this.lastRound!.matchConfig);

    const eventSelections = this.lastRound!.eventDetails.map((eventDetail) => {
      const eventDetailSelections = {} as Record<string, Selection>;
      eventDetail.selections!.forEach((selection) => {
        eventDetailSelections[selection.name] = selection;
      });
      return eventDetailSelections;
    });

    this.round = {
      roundId: this.lastRound!.roundId,
      roundTime: Math.round((new Date().getTime() - this.lastRound!.scheduleStartTs.getTime()) / 1000),
      homeTeam: this.lastRound!.eventNameAKey,
      awayTeam: this.lastRound!.eventNameBKey,
      numberOfDraws: this.lastRound!.eventDetails.length,
      result: { drawResults },
      settlementResult,
      selections: eventSelections,
    };

    this.event = this.lastRound!;
  }

  private async updateOddsForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.selections = this.eventDetails[drawIndex].selections;
    await this.eventService.updateEventDetail(eventDetail, ["selections"]);
  }

  private async updateVideoInfoForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.playlist = this.eventDetails[drawIndex].playlist;
    eventDetail.goalInfo = this.eventDetails[drawIndex].goalInfo;
    await this.eventService.updateEventDetail(eventDetail, ["playlist", "goalInfo"]);
  }

  private async updateResultForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.result = this.eventDetails[drawIndex].result;
    eventDetail.selections = this.eventDetails[drawIndex].selections!;
    eventDetail.hasResult = true;
    eventDetail.selections.forEach((selection: Selection) => {
      selection.settlementStatus = this.round.settlementResult![drawIndex][selection.name];
    });
    await this.eventService.updateEventDetail(eventDetail, ["result", "hasResult", "selections"]);
  }
}
