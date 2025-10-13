import Agenda, { Job } from "agenda";
import { logger } from "sc-common";
import { AppContainer, GameSettings, JobName } from "../types";
import { GameHandler } from "./game-handler";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { idHelper } from "@soccer-marble/shared-utils";

export class Consumer {
  protected readonly agenda: Agenda;
  protected readonly logService: typeof logger;
  protected readonly gameHandler: GameHandler;
  protected readonly roundService: RoundService;
  protected readonly eventService: EventService;
  protected readonly gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.agenda = container.agenda;
    this.logService = container.logService;
    this.gameHandler = container.gameHandler;
    this.roundService = container.roundService;
    this.eventService = container.eventService;
    this.gameSettings = container.gameSettings;
  }

  consumeScheduleUpcomingEvent() {
    this.agenda.define(JobName.ScheduleUpcomingEvent, async (job: Job) => {
      try {
        const upcomingEvents = await this.eventService.fetchAllUpcomingEvents();

        if (upcomingEvents.length < this.gameSettings.upcomingEvents) {
          const lastRoundId = await this.roundService.initializeRoundId();
          const lastEventId = idHelper.createEventId(this.gameSettings.gameId, lastRoundId);
          const lastEvent = await this.eventService.fetchEvent(lastEventId, true);

          const upcomingRoundId = lastRoundId + 1;
          const upcomingScheduleStartTs = lastEvent ? new Date(lastEvent.scheduleEndTs.getTime()) : new Date();

          await this.gameHandler.createUpcomingRoundAndEvent(upcomingRoundId, upcomingScheduleStartTs);
        }
      } catch (error) {
        this.logService.logError(`Error in scheduleUpComingEvent: ${error}`);
      } finally {
        await job.remove();
      }
    });
  }

  consumeUpdateEventDetailOdds() {
    this.agenda.define(JobName.UpdateEventDetailOdds, async (job: Job) => {
      try {
        const { eventDetailId, eventID, drawIndex } = job.attrs.data;

        const roundId = idHelper.extractRoundId(eventID);

        await this.gameHandler.handleOddsAvailableForEventDetail(drawIndex, eventDetailId, roundId);
      } catch (error) {
        this.logService.logError(`Error in updateEventDetailOdds: ${error}`);
      } finally {
        await job.remove();
      }
    });
  }

  consumeUpdateEventDetailVideoInfo() {
    this.agenda.define(JobName.UpdateEventDetailVideoInfo, async (job: Job) => {
      try {
        const { eventDetailId, eventID, drawIndex } = job.attrs.data;
        const roundId = idHelper.extractRoundId(eventID);

        await this.gameHandler.handleVideoInfoAvailableForEventDetail(drawIndex, eventDetailId, roundId);
      } catch (error) {
        this.logService.logError(`Error in updateEventDetailVideoInfo: ${error}`);
      } finally {
        await job.remove();
      }
    });
  }

  consumeUpdateEventDetailResult() {
    this.agenda.define(JobName.UpdateEventDetailResult, async (job: Job) => {
      try {
        const { eventDetailId, eventID, drawIndex } = job.attrs.data;
        const roundId = idHelper.extractRoundId(eventID);

        await this.gameHandler.handleResultAvailableForEventDetail(drawIndex, eventDetailId, roundId);
      } catch (error) {
        this.logService.logError(`Error in updateEventDetailResult: ${error}`);
      } finally {
        await job.remove();
      }
    });
  }

  async start() {
    this.consumeScheduleUpcomingEvent();
    this.consumeUpdateEventDetailOdds();
    this.consumeUpdateEventDetailVideoInfo();
    this.consumeUpdateEventDetailResult();
  }
}
