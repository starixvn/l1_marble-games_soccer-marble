import cron from "cron";
import { AppContainer, Selection, GameSettings, GameRunningRound, Timeline } from "../types";
import { IEventDetail } from "../models/event-details";
import { IRound } from "../models/rounds";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { RoundGeneratorService } from "../services/round-generator-service";
import { logger } from "sc-common";
import { decrypt } from "../helpers/crypto-helper";
import { GameConfigService } from "../services/game-config-service";

export class GameCron {
  private readonly roundService: RoundService;
  private readonly eventService: EventService;
  private readonly roundGeneratorService: RoundGeneratorService;
  private readonly gameConfigService: GameConfigService;
  private readonly gameSettings: GameSettings;
  private readonly logService: typeof logger;
  private readonly upcomingRound: number[];

  private round: GameRunningRound;
  private eventDetails: IEventDetail[];
  private enabled: boolean;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
    this.roundService = container.roundService;
    this.eventService = container.eventService;
    this.roundGeneratorService = container.roundGeneratorService;
    this.gameConfigService = container.gameConfigService;
    this.enabled = false;
    this.round = { roundTime: 0, ended: true } as GameRunningRound;
    this.eventDetails = [];
    this.upcomingRound = [];
  }

  private async initRoundId() {
    this.round.roundId = await this.roundService.initializeRoundId();
  }

  private async handleUnfinishedEvents() {
    const unfinishedRounds = (await this.roundService.fetchAllUnfinishedRounds()).sort((a, b) => b.roundId - a.roundId);
    const unfinishedEvents = await this.eventService.fetchAllUpcomingEvents();

    this.logService.logError(`List of unfinished events: ${unfinishedRounds.map((round) => round.eventID).join(", ")}`);

    this.logService.logError(
      `List of unfinished upcoming events: ${unfinishedEvents.map((event) => event.eventID).join(", ")}`
    );

    this.logService.log(`current time: ${new Date()}`, "info");
  }

  private async scheduleUpcomingEvents() {
    const upcomingEvents = this.gameSettings.upcomingEvents;

    for (let i = 1; i < upcomingEvents; i++) {
      await this.createUpcomingRoundAndEvent(i);
    }
  }

  async start() {
    try {
      await this.initRoundId();
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
    if (this.round.roundTime === 0) {
      await this.setGameEnabled();
    }

    if (this.enabled && this.upcomingRound.length === 0) {
      await this.scheduleUpcomingEvents();
    }

    if (this.enabled || this.upcomingRound.length > 0 || !this.round.ended) {
      this.round.roundTime++;
    }

    const currentRoundTime = this.round.roundTime;
    const { timelines, wholeRound } = this.gameSettings.gameTiming;

    if (currentRoundTime === 1) {
      await this.createUpcomingRoundAndEvent(this.gameSettings.upcomingEvents);
      await this.startNewRound();
    }

    await this.processTimelines(timelines, currentRoundTime);

    if (currentRoundTime === wholeRound || currentRoundTime > wholeRound) {
      this.round.roundTime = 0;
      this.round.ended = true;
      await this.roundService.insertOrUpdateRound(this.round as IRound);
    }
  }

  private async setGameEnabled() {
    const gameConfig = await this.gameConfigService.getGameConfig();

    if (!gameConfig) {
      this.enabled = false;
      this.logService.logError("Game config not found");
      return;
    }

    this.enabled = gameConfig.enabled;
  }

  private async processTimelines(timelines: Timeline[], currentRoundTime: number) {
    for (const [drawIndex, timeline] of timelines.entries()) {
      if (currentRoundTime === timeline.OddsAvailable && drawIndex !== 0) {
        await this.updateOddsForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ScheduleStart) {
        await this.updateVideoInfoForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable) {
        await this.updateResultForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable && drawIndex === timelines.length - 1) {
        await this.updateSettlementResult();
        await this.roundService.markRoundAsEnded(this.round.roundId);
      }
    }
  }

  private async startNewRound(): Promise<void> {
    const nextRoundId = this.upcomingRound.shift();

    if (!nextRoundId) {
      return this.logService.logError("No upcoming round found");
    }

    const newRound = await this.roundService.fetchRoundData(nextRoundId);
    const event = await this.eventService.fetchEvent(newRound.eventID);
    const eventDetails = await Promise.all(event.eventDetails.map((id) => this.eventService.fetchEventDetail(id)));

    this.eventDetails = eventDetails;
    this.round = {
      ...newRound,
      roundTime: 1,
      result: decrypt(newRound.encryptedResult),
      settlementResult: decrypt(newRound.encryptedSettlementResult),
      selections: decrypt(newRound.encryptedSelections),
    };
  }

  private async createUpcomingRoundAndEvent(offsetFromCurrent: number): Promise<void> {
    if (!this.enabled) {
      return this.logService.log("Game is not enabled, skipping upcoming round and event creation", "info");
    }

    const upcomingRoundId = this.round.roundId + offsetFromCurrent;
    this.upcomingRound.push(upcomingRoundId);
    const newRound = this.roundGeneratorService.generateNewRound(upcomingRoundId);

    await this.roundService.insertOrUpdateRound(newRound as IRound);
    const event = await this.eventService.createNewEvent(newRound, offsetFromCurrent);
    const firstEventDetail = await this.eventService.fetchEventDetail(event.eventDetails[0]);

    const selections = decrypt(newRound.encryptedSelections);
    firstEventDetail.selections = Object.values(selections![0]);
    firstEventDetail.oddsAvailableTs = new Date();

    await this.eventService.updateEventDetail(firstEventDetail, ["selections", "oddsAvailableTs"]);
  }

  private async updateOddsForDraw(drawIndex: number) {
    const eventDetail = this.eventDetails[drawIndex];
    eventDetail.selections = Object.values(this.round.selections![drawIndex]);
    await this.eventService.updateEventDetail(eventDetail, ["selections"]);
  }

  private async updateVideoInfoForDraw(drawIndex: number) {
    const eventDetail = this.eventDetails[drawIndex];
    eventDetail.playlist = this.round.result!.drawResults[drawIndex].playlist;
    eventDetail.goalInfo = this.round.result!.drawResults[drawIndex].goalInfo;

    await this.eventService.updateEventDetail(eventDetail, ["playlist", "goalInfo"]);
  }

  private async updateResultForDraw(drawIndex: number) {
    const eventDetail = this.eventDetails[drawIndex];
    eventDetail.hasResults = true;
    eventDetail.result = this.round.result!.drawResults[drawIndex].result;
    await this.eventService.updateEventDetail(eventDetail, ["result", "hasResults"]);
  }

  private async updateSettlementResult() {
    await Promise.all(
      this.eventDetails.map((eventDetail, drawIndex) => {
        eventDetail.selections!.forEach((selection: Selection) => {
          selection.settlementStatus = this.round.settlementResult![drawIndex][selection.name];
        });
        return this.eventService.updateEventDetail(eventDetail, ["selections"]);
      })
    );
  }
}
