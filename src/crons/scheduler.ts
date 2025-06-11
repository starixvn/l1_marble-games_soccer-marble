import Agenda from "agenda";
import { gameSettings } from "../game-settings";
import { AppContainer, JobName } from "../types";
import { EventService } from "../services/event-service";
import { GameData } from "./game-data";
import { IEventDetail } from "../models/event-details";

export class Scheduler {
  private readonly agenda: Agenda;
  private readonly eventService: EventService;
  private readonly gameData: GameData;
  private gameStatusInterval: NodeJS.Timeout | null = null;
  private wholeRoundInterval: NodeJS.Timeout | null = null;

  constructor(container: AppContainer) {
    this.agenda = container.agenda;
    this.eventService = container.eventService;
    this.gameData = container.gameData;
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

    if (this.gameData.gameConfig?.enabled) {
      this.clearIntervals();
      await this.scheduleUpcomingEvents();

      this.wholeRoundInterval = setInterval(async () => {
        await this.schedule();
      }, gameSettings.gameTiming.wholeRound * 1000);
    }
  }

  async scheduleUpcomingEvent(msDelay = 0) {
    await this.agenda.schedule(new Date(Date.now() + msDelay), JobName.ScheduleUpcomingEvent, {});
  }

  async scheduleUpcomingEvents() {
    const upcomingEvents = await this.eventService.fetchAllUpcomingEvents();
    const upcomingEventsToSchedule = Math.max(gameSettings.upcomingEvents - upcomingEvents.length, 0);

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

    if (!this.gameData.gameConfig?.enabled) {
      this.clearIntervals();

      this.gameStatusInterval = setInterval(async () => {
        await this.checkGameStatus();
      }, 1000);

      return;
    }

    await this.scheduleUpcomingEvents();
  }

  async start() {
    await this.agenda.start();

    this.gameStatusInterval = setInterval(async () => {
      await this.checkGameStatus();
    }, 1000);
  }
}
