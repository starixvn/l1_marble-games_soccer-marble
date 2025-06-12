import Agenda, { Job } from "agenda";
import { logger } from "sc-common";
import { AppContainer, GameSettings, JobName } from "../types";
import { GameHandler } from "./game-handler";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { idHelper } from "../helpers";

export class Consumer {
  private readonly agenda: Agenda;
  private readonly logService: typeof logger;
  private readonly gameHandler: GameHandler;
  private readonly roundService: RoundService;
  private readonly eventService: EventService;
  private readonly gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.agenda = container.agenda;
    this.logService = container.logService;
    this.gameHandler = container.gameHandler;
    this.roundService = container.roundService;
    this.eventService = container.eventService;
    this.gameSettings = container.gameSettings;
  }

  async start() {
    this.agenda.define(JobName.ScheduleUpcomingEvent, async (job: Job) => {
      try {
        const lastRoundId = await this.roundService.initializeRoundId();

        const lastEventId = idHelper.createEventId(this.gameSettings.gameId, lastRoundId);
        const lastEvent = await this.eventService.fetchEvent(lastEventId, true);

        const upcomingRoundId = lastRoundId + 1;
        const upcomingScheduleStartTs = lastEvent
          ? new Date(lastEvent.scheduleStartTs.getTime() + this.gameSettings.gameTiming.wholeRound * 1000)
          : new Date();

        await this.gameHandler.createUpcomingRoundAndEvent(upcomingRoundId, upcomingScheduleStartTs);
      } catch (error) {
        this.logService.logError(`Error in scheduleUpComingEvent: ${error}`);
      } finally {
        await job.remove();
      }
    });

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
}
