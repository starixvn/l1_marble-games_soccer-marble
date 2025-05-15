import cron from "cron";
import { AppContainer, GameSettings } from "../types";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { logger } from "sc-common";
import { GameStateManager } from "./game-state-manager";
import { TimelineProcessor } from "./timeline-processor-service";

export class GameCron {
  private readonly roundService: RoundService;
  private readonly eventService: EventService;
  private readonly gameSettings: GameSettings;
  private readonly logService: typeof logger;
  private readonly gameStateManager: GameStateManager;
  private readonly timelineProcessor: TimelineProcessor;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
    this.roundService = container.roundService;
    this.eventService = container.eventService;
    this.gameStateManager = container.gameStateManager;
    this.timelineProcessor = container.timelineProcessor;
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

    for (let offset = 1; offset < upcomingEvents; offset++) {
      await this.gameStateManager.createUpcomingRoundAndEvent(offset);
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

    if (gameState.isPreRoundPhase()) {
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

    const currentRoundTime = gameState.getCurrentRoundTime();
    await this.timelineProcessor.processTimelines(currentRoundTime);
  }
}
