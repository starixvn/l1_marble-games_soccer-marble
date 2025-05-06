import cron from "cron";
import { AppContainer, Event, Selection, GameSettings, GameRunningRound } from "../types";
import { IEventDetail } from "../models/event-details";
import { IRound } from "../models/rounds";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { MatchGeneratorService } from "../services/match-generator-service";
import { encrypt } from "../helpers/crypto-helper";
import { logger } from "sc-common";

// Main GameCron class
export class GameCron {
  private roundService: RoundService;
  private eventService: EventService;
  private matchGeneratorService: MatchGeneratorService;
  private round: GameRunningRound;
  private event: Event;
  private lastRound?: IRound;
  private gameSettings: GameSettings;
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
      disabled: false,
    } as GameRunningRound;

    this.event = {} as Event;
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

  private async handleUnfinishedEvent() {
    if (this.lastRound && !this.lastRound.ended) {
      this.logService.logError(`Handling unfinished event ${this.lastRound.eventID} & round ${this.lastRound.roundId}`);
    }
  }

  async start() {
    try {
      await this.initRoundId();
      await this.getLastRound();
      await this.handleUnfinishedEvent();
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
    if (this.round.roundTime === 0) {
    }

    if (!this.round.disabled) {
      this.round.roundTime++;
    }

    const currentRoundTime = this.round.roundTime;
    console.log(currentRoundTime);
    const { timelines, wholeRound } = this.gameSettings.gameTiming;

    if (currentRoundTime === 1) {
      await this.startNewRound();
    }

    await this.processTimelines(timelines, currentRoundTime);

    if (currentRoundTime > wholeRound) {
      this.round.roundTime = 0;
    }
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
        await this.roundService.markRoundAsEnded(this.round.roundId);
        await this.roundService.updateRoundEventDetailResult(this.round.roundId, this.event.eventDetails as IEventDetail[]);
      }
    }
  }

  private async startNewRound() {
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
    this.event.eventDetails.forEach((eventDetail, drawIndex) => {
      eventDetail.selections = Object.values(this.round.selections![drawIndex]);
      eventDetail.playlist = this.round.result!.drawResults[drawIndex].playlist;
      eventDetail.goalInfo = this.round.result!.drawResults[drawIndex].goalInfo;
      eventDetail.hasResult = true;
      eventDetail.result = this.round.result!.drawResults[drawIndex].result;
    });
  }

  private async createNewRound() {
    try {
      const encryptedEventDetails = this.event.eventDetails.map((eventDetail) => encrypt(eventDetail));

      const newRound = {
        eventID: this.event.eventID,
        eventNameAKey: this.event.eventNameAKey,
        eventNameBKey: this.event.eventNameBKey,
        gameId: this.gameSettings.gameId,
        scheduleStartTs: this.event.scheduleStartTs,
        scheduleEndTs: this.event.scheduleEndTs,
        eventDetails: [],
        encryptedEventDetails,
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

  private async updateOddsForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    await this.eventService.updateEventDetail(eventDetail, ["selections"]);
  }

  private async updateVideoInfoForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    await this.eventService.updateEventDetail(eventDetail, ["playlist", "goalInfo"]);
  }

  private async updateResultForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.hasResult = true;
    eventDetail.selections!.forEach((selection: Selection) => {
      selection.settlementStatus = this.round.settlementResult![drawIndex][selection.name];
    });
    await this.eventService.updateEventDetail(eventDetail, ["result", "hasResult", "selections"]);
  }
}
