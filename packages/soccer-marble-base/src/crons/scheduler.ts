import Agenda from "agenda";
import { AppContainer, GameSettings, JobName } from "../types";
import { EventService } from "../services/event-service";
import { GameData } from "./game-data";
import { IEventDetail } from "../models/event-details";
import { secureRandomRange } from "sc-core-rng";
import { RoundService } from "../services/round-service";

export class Scheduler {
  protected readonly agenda: Agenda;
  protected readonly eventService: EventService;
  protected readonly gameData: GameData;
  protected readonly gameSettings: GameSettings;
  protected gameStatusInterval: NodeJS.Timeout | null = null;
  protected wholeRoundInterval: NodeJS.Timeout | null = null;
  protected readonly scheduleBufferMs = 100;
  protected readonly roundService: RoundService;

  constructor(container: AppContainer) {
    this.agenda = container.agenda;
    this.eventService = container.eventService;
    this.gameData = container.gameData;
    this.gameSettings = container.gameSettings;
    this.roundService = container.roundService;
  }

  clearIntervals() {
    if (this.gameStatusInterval) {
      clearInterval(this.gameStatusInterval);
      this.gameStatusInterval = null;
    }
    if (this.wholeRoundInterval) {
      clearInterval(this.wholeRoundInterval);
      this.wholeRoundInterval = null;
    }
  }

  async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async checkGameStatus() {
    await this.gameData.loadGameConfig();

    if (this.gameData.gameConfig?.config?.enabled) {
      this.clearIntervals();
      await this.scheduleUpcomingEvents();

      this.wholeRoundInterval = setInterval(async () => {
        await this.schedule();
      }, this.gameSettings.gameTiming.wholeRound * 1000);
    }
  }

  async scheduleUpcomingEvent(upcomingEventsToSchedule: number, lastRoundId: number) {
    await this.agenda.schedule(new Date(Date.now()), JobName.ScheduleUpcomingEvent, {
      upcomingEventsToSchedule,
      lastRoundId,
    });
  }

  async scheduleUpcomingEvents() {
    const maxDelay = 5000;
    const upcomingEvents = await this.eventService.fetchAllUpcomingEvents();
    const lastRoundId = await this.roundService.initializeRoundId();
    const upcomingEventsToSchedule = Math.max(this.gameSettings.upcomingEvents - upcomingEvents.length, 0);

    if (upcomingEventsToSchedule > 0) {
      const randomDelay = secureRandomRange(0, maxDelay);

      // Add random delay to avoid creating upcoming events at the same time
      await this.delay(randomDelay);
      this.scheduleUpcomingEvent(upcomingEventsToSchedule, lastRoundId);
    }
  }

  async scheduleUpdateEventDetail(eventDetail: IEventDetail, drawIndex: number) {
    const eventDetailId = eventDetail._id;
    const eventID = eventDetail.eventID;

    drawIndex !== 0 &&
      (await this.agenda.schedule(
        new Date(eventDetail.oddsAvailableTs.getTime() - this.scheduleBufferMs),
        JobName.UpdateEventDetailOdds,
        {
          eventDetailId,
          eventID,
          drawIndex,
        }
      ));

    await this.agenda.schedule(
      new Date(eventDetail.scheduleStartTs.getTime() - this.scheduleBufferMs),
      JobName.UpdateEventDetailVideoInfo,
      {
        eventDetailId,
        eventID,
        drawIndex,
      }
    );

    await this.agenda.schedule(
      new Date(eventDetail.resultsAvailableTs.getTime() - this.scheduleBufferMs),
      JobName.UpdateEventDetailResult,
      {
        eventDetailId,
        eventID,
        drawIndex,
      }
    );
  }

  async schedule() {
    await this.gameData.loadGameConfig();

    if (!this.gameData.gameConfig?.config?.enabled) {
      this.clearIntervals();

      this.gameStatusInterval = setInterval(async () => {
        await this.checkGameStatus();
      }, 1000);

      return;
    }

    await this.scheduleUpcomingEvents();
  }

  async start() {
    this.gameStatusInterval = setInterval(async () => {
      await this.checkGameStatus();
    }, 1000);
  }
}
