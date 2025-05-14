import cron from "cron";
import { AppContainer, GameSettings, Timeline } from "../types";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { logger } from "sc-common";
import { GameStateManager } from "./game-state-manager";

export class GameCron {
  private readonly roundService: RoundService;
  private readonly eventService: EventService;
  private readonly gameSettings: GameSettings;
  private readonly logService: typeof logger;

  private readonly gameStateManager: GameStateManager;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
    this.roundService = container.roundService;
    this.eventService = container.eventService;

    this.gameStateManager = new GameStateManager(container);
  }

  async initRoundId() {
    const roundId = await this.roundService.initializeRoundId();
    this.gameStateManager.setRoundId(roundId);
  }

  async handleUnfinishedEvents() {
    const unfinishedRounds = (await this.roundService.fetchAllUnfinishedRounds()).sort((a, b) => b.roundId - a.roundId);
    const unfinishedEvents = await this.eventService.fetchAllUpcomingEvents();

    this.logService.logError(`List of unfinished events: ${unfinishedRounds.map((round) => round.eventID).join(", ")}`);

    this.logService.logError(
      `List of unfinished upcoming events: ${unfinishedEvents.map((event) => event.eventID).join(", ")}`
    );

    this.logService.log(`current time: ${new Date()}`, "info");
  }

  async scheduleUpcomingEvents() {
    const upcomingEvents = this.gameSettings.upcomingEvents;

    for (let i = 1; i < upcomingEvents; i++) {
      await this.gameStateManager.createUpcomingRoundAndEvent(i);
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

  startCron() {
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

  async proceed() {
    const gameState = this.gameStateManager;
    const { timelines } = this.gameSettings.gameTiming;
    const currentRoundTime = gameState.getCurrentRoundTime();

    if (gameState.isBeforeStartNewRound()) {
      await gameState.setGameEnabled();
    }

    if (gameState.shouldScheduleUpcomingRounds()) {
      await this.scheduleUpcomingEvents();
    }

    if (gameState.shouldAdvanceRound()) {
      gameState.advanceRound();
    }

    if (gameState.isAtStartNewRound()) {
      await gameState.createUpcomingRoundAndEvent(this.gameSettings.upcomingEvents);
      await gameState.startNewRound();
    }

    if (gameState.isAtRoundEnded()) {
      await gameState.endCurrentRound();
    }

    await this.processTimelines(timelines, currentRoundTime, gameState);
  }

  async processTimelines(timelines: Timeline[], currentRoundTime: number, gameState: GameStateManager) {
    for (const [drawIndex, timeline] of timelines.entries()) {
      if (currentRoundTime === timeline.OddsAvailable && drawIndex !== 0) {
        await gameState.updateOddsForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ScheduleStart) {
        await gameState.updateVideoInfoForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable) {
        await gameState.updateResultForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable && drawIndex === timelines.length - 1) {
        await gameState.settleRound();
      }
    }
  }
}
