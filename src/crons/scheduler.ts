import Agenda from "agenda";
import { AppContainer, GameSettings, JobName } from "../types";
import { EventService } from "../services/event-service";
import { GameData } from "./game-data";
import { IEventDetail } from "../models/event-details";

export class Scheduler {
  private readonly agenda: Agenda;
  private readonly eventService: EventService;
  private readonly gameData: GameData;
  private readonly gameSettings: GameSettings;
  private gameStatusInterval: NodeJS.Timeout | null = null;
  private wholeRoundInterval: NodeJS.Timeout | null = null;

  constructor(container: AppContainer) {
    this.agenda = container.agenda;
    this.eventService = container.eventService;
    this.gameData = container.gameData;
    this.gameSettings = container.gameSettings;
  }

  private clearIntervals() {
    if (this.gameStatusInterval) {
      clearInterval(this.gameStatusInterval);
      this.gameStatusInterval = null;
    }
    if (this.wholeRoundInterval) {
      clearInterval(this.wholeRoundInterval);
      this.wholeRoundInterval = null;
    }
  }

  private async checkGameStatus() {
    await this.gameData.loadGameConfig();

    if (this.gameData.gameConfig?.config?.enabled) {
      this.clearIntervals();
      await this.scheduleUpcomingEvents();

      this.wholeRoundInterval = setInterval(async () => {
        await this.schedule();
      }, this.gameSettings.gameTiming.wholeRound * 1000);
    }
  }

  async scheduleUpcomingEvent(msDelay = 0) {
    await this.agenda.schedule(new Date(Date.now() + msDelay), JobName.ScheduleUpcomingEvent, {});
  }

  async scheduleUpcomingEvents() {
    const upcomingEvents = await this.eventService.fetchAllUpcomingEvents();
    const upcomingEventsToSchedule = Math.max(this.gameSettings.upcomingEvents - upcomingEvents.length, 0);

    for (let i = 1; i <= upcomingEventsToSchedule; i++) {
      const delay = i * 2000; // 2 seconds delay
      await this.scheduleUpcomingEvent(delay);
    }
  }

  async scheduleUpdateEventDetail(eventDetail: IEventDetail, drawIndex: number) {
    const eventDetailId = eventDetail._id;
    const eventID = eventDetail.eventID;

    await this.agenda.schedule(eventDetail.oddsAvailableTs, JobName.UpdateEventDetailOdds, {
      eventDetailId,
      eventID,
      drawIndex,
    });

    await this.agenda.schedule(eventDetail.scheduleStartTs, JobName.UpdateEventDetailVideoInfo, {
      eventDetailId,
      eventID,
      drawIndex,
    });

    await this.agenda.schedule(eventDetail.resultsAvailableTs, JobName.UpdateEventDetailResult, {
      eventDetailId,
      eventID,
      drawIndex,
    });
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
