import { logger } from "sc-common";
import { EventService } from "../services/event-service";
import { RoundService } from "../services/round-service";
import { AppContainer, GameSettings } from "../types";
import { GameStateManager } from "./game-state-manager";

export class RoundScheduler {
  private readonly gameStateManager: GameStateManager;
  private readonly gameSettings: GameSettings;
  private readonly roundService: RoundService;
  private readonly eventService: EventService;
  private readonly logService: typeof logger;

  isScheduling = false;

  constructor(container: AppContainer) {
    this.roundService = container.roundService;
    this.eventService = container.eventService;
    this.gameStateManager = container.gameStateManager;
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
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
    this.isScheduling = true;
    const upcomingEvents = this.gameSettings.upcomingEvents;

    for (let offset = 1; offset < upcomingEvents; offset++) {
      await this.gameStateManager.createUpcomingRoundAndEvent(offset);
    }
  }
}
