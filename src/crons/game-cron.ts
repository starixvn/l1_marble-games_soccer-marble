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

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
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
  }

  async start() {
    try {
      await this.initRoundId();
      await this.getLastRound();
      await this.updateUnfinishedEvents();
      this.startCron();
    } catch (error) {
      console.log(error);
    }
  }

  private startCron() {
    const job = new cron.CronJob(
      "* * * * * *",
      () => this.proceed().catch(console.error),
      () => {
        console.error("Game cron job unexpectedly stopped because some other tasks halt it.");
        job.start();
      }
    );

    job.start();
  }

  private async proceed() {
    const currentRoundTime = this.round.roundTime;
    const { timelines, wholeRound } = this.gameSettings.gameTiming;

    if (currentRoundTime > wholeRound || this.round.roundTime === 0) {
      await this.roundService.markRoundAsEnded(this.round.roundId);
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

  private async initRoundId() {
    this.round.roundId = await this.roundService.initializeRoundId();
  }

  private async getLastRound() {
    const lastRound = await this.roundService.fetchLastRound(this.round.roundId);
    if (lastRound) {
      this.lastRound = lastRound;
    }
  }

  private async startNewRound() {
    this.round.roundTime = 0;
    this.round.roundId++;

    const { homeTeam, awayTeam } = this.matchGeneratorService.createNewMatch();
    this.round.homeTeam = homeTeam;
    this.round.awayTeam = awayTeam;

    this.round.matchConfig = this.matchGeneratorService.createNewMatchConfig();

    const { odds, matchConfig, selections } = this.matchGeneratorService.generateRoundOddsAndUpdateMatchConfig(
      this.round.matchConfig
    );
    this.round.odds = odds;
    this.round.matchConfig = matchConfig;
    this.round.selections = selections;

    this.round.result = this.matchGeneratorService.generateResult(this.round.matchConfig, this.gameSettings.numberOfVideos);

    this.round.settlementResult = this.matchGeneratorService.getSettlementResult(this.round.result, this.round.matchConfig);

    this.round.odds = this.matchGeneratorService.updateSecondHalfOdds(this.round.odds!, this.round.settlementResult);

    this.event = await this.eventService.createNewEvent(this.round);
    await this.createNewRound();
  }

  private async createNewRound() {
    try {
      const eventDetails = this.event.eventDetails.map((eventDetail: any) => eventDetail.toObject());

      eventDetails.forEach((eventDetail, drawIndex) => {
        eventDetail.selections = Object.values(this.round.selections![drawIndex]);
        eventDetail.result = this.round.result!.drawResults[drawIndex].result;
        eventDetail.playlist = this.round.result!.drawResults[drawIndex].playlist;
        eventDetail.goalInfo = this.round.result!.drawResults[drawIndex].goalInfo;
      });

      const newRound = {
        roundId: this.round.roundId,
        eventID: this.event.eventID,
        eventNameAKey: this.event.eventNameAKey,
        eventNameBKey: this.event.eventNameBKey,
        eventDetails: eventDetails,
        gameId: this.gameSettings.gameId,
        ended: false,
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + this.gameSettings.gameTiming.wholeRound * 1000),
      };

      await this.roundService.saveNewRound(newRound);
    } catch (error) {
      console.error(`Error creating new round: ${error}`);
      throw error;
    }
  }

  private async updateUnfinishedEvents() {
    if (this.lastRound && !this.lastRound.ended) {
      const currentDate = new Date();
      const eventDetails = this.lastRound.eventDetails;

      if (currentDate > this.lastRound.endTime) {
        await this.roundService.markRoundAsEnded(this.lastRound.roundId);
        await this.updateAllEventDetails(eventDetails);
      } else {
        await this.updateEventDetailsByTimeline(eventDetails, currentDate);
        await this.updateRoundFromLastRound();
      }
    }
  }

  private async updateAllEventDetails(eventDetails: any[]) {
    for (const eventDetail of eventDetails) {
      const eventDetailWithId = eventDetail as unknown as IEventDetail;
      if (eventDetailWithId._id) {
        await this.eventService.updateEventDetail(eventDetailWithId);
      }
    }
  }

  private async updateEventDetailsByTimeline(eventDetails: any[], currentDate: Date) {
    for (const eventDetail of eventDetails) {
      const eventDetailWithId = eventDetail as unknown as IEventDetail;
      if (!eventDetailWithId._id) continue;

      if (eventDetail.oddsAvailableTs < currentDate) {
        await this.eventService.updateEventDetail(eventDetailWithId, ["selections"]);
      }

      if (eventDetail.scheduleStartTs < currentDate) {
        await this.eventService.updateEventDetail(eventDetailWithId, ["playlist", "goalInfo"]);
      }

      if (eventDetail.resultsAvailableTs < currentDate) {
        await this.eventService.updateEventDetail(eventDetailWithId, ["result"]);
      }
    }
  }

  private async updateRoundFromLastRound() {
    const drawResults = this.lastRound!.eventDetails.map((eventDetail) => ({
      result: eventDetail.result || "",
      playlist: eventDetail.playlist || "",
      goalInfo: eventDetail.goalInfo || "",
    })) as DrawResultType[];

    const settlementResult = this.lastRound!.eventDetails.map((eventDetail) => {
      const drawSettlementResult: DrawSettlementResultType = {};
      eventDetail.selections!.forEach((selection) => {
        drawSettlementResult[selection.name] = selection.settlementStatus;
      });
      return drawSettlementResult;
    });

    const eventSelections = this.lastRound!.eventDetails.map((eventDetail) => {
      const eventDetailSelections = {} as Record<string, Selection>;
      eventDetail.selections!.forEach((selection) => {
        eventDetailSelections[selection.name] = selection;
      });
      return eventDetailSelections;
    });

    this.round = {
      roundId: this.lastRound!.roundId,
      roundTime: Math.round((new Date().getTime() - this.lastRound!.startTime.getTime()) / 1000),
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

    eventDetail.selections = Object.values(this.round.selections![drawIndex]);
    await this.eventService.updateEventDetail(eventDetail, ["selections"]);
  }

  private async updateVideoInfoForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.playlist = this.round.result!.drawResults[drawIndex].playlist;
    eventDetail.goalInfo = this.round.result!.drawResults[drawIndex].goalInfo;
    await this.eventService.updateEventDetail(eventDetail, ["playlist", "goalInfo"]);
  }

  private async updateResultForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.result = this.round.result!.drawResults[drawIndex].result;
    eventDetail.selections!.forEach((selection) => {
      selection.settlementStatus = this.round.settlementResult![drawIndex][selection.name];
    });
    await this.eventService.updateEventDetail(eventDetail, ["result"]);
  }
}
