import cron from "cron";
import { AppContainer, GameSettings } from "../types";
import { logger } from "sc-common";
import { GameStateManager } from "./game-state-manager";
import { TimelineProcessor } from "./timeline-processor";
import { RoundScheduler } from "./round-scheduler";
export class GameCron {
  private readonly gameSettings: GameSettings;
  private readonly logService: typeof logger;
  private readonly gameStateManager: GameStateManager;
  private readonly timelineProcessor: TimelineProcessor;
  private readonly roundScheduler: RoundScheduler;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
    this.gameStateManager = container.gameStateManager;
    this.timelineProcessor = container.timelineProcessor;
    this.roundScheduler = container.roundScheduler;
  }

  async start() {
    try {
      await this.roundScheduler.initRoundId();
      await this.roundScheduler.handleUnfinishedEvents();
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
    if (this.gameStateManager.isPreRoundPhase()) {
      await this.gameStateManager.setGameEnabled();
    }

    if (this.gameStateManager.shouldScheduleUpcomingRounds()) {
      await this.roundScheduler.scheduleUpcomingEvents();
    }

    if (this.gameStateManager.isGameDisabledAndAllRoundsEnded() && this.roundScheduler.isScheduling) {
      this.logService.log("Game is disabled and all rounds ended", "info");
      this.roundScheduler.isScheduling = false;
    }

    if (this.gameStateManager.shouldAdvanceRoundTime()) {
      this.gameStateManager.advanceRoundTime();
    }

    const currentRoundTime = this.gameStateManager.getCurrentRoundTime();

    if (this.gameStateManager.isAtStartNewRound()) {
      await this.gameStateManager.createUpcomingRoundAndEvent(this.gameSettings.upcomingEvents);
      await this.gameStateManager.startNewRound();
    }

    await this.timelineProcessor.processTimelines(currentRoundTime);

    if (this.gameStateManager.isAtRoundEnded()) {
      this.gameStateManager.resetRoundTime();
    }
  }
}
