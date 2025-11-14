import { Schema } from "mongoose";
import { EventModel, EventDetailModel } from "../models";
import { IEventDetail } from "../models/event-details";
import { IEvent } from "../models/events";
import { GameSettings, AppContainer, EventDetail, GameRunningRound } from "../types";
import { logger } from "sc-common";
import { retryHelper } from "@soccer-marble/shared-utils";

export class EventService {
  protected readonly eventRepository: typeof EventModel;
  protected readonly eventDetailsRepository: typeof EventDetailModel;
  protected readonly gameSettings: GameSettings;
  protected readonly logService: typeof logger;

  constructor(container: AppContainer) {
    this.eventRepository = container.eventRepository;
    this.eventDetailsRepository = container.eventDetailsRepository;
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
  }

  async createNewEvent(roundData: GameRunningRound, scheduleStartTs: Date) {
    const eventId = roundData.eventID;
    const preloadDuration = roundData.matchConfig.gameTiming?.extraInfo?.preloadDuration || 0;
    const eventStartTimeTs = Math.max(scheduleStartTs.getTime(), new Date().getTime() + 2000); // 2 seconds delay
    const wholeRound = roundData.matchConfig.gameTiming.wholeRound;
    const eventDetails = await this.createNewEventDetails(eventId, new Date(eventStartTimeTs), roundData);

    const event: Omit<IEvent, "_id"> = {
      eventID: eventId,
      eventNameAKey: roundData.homeTeam,
      eventNameBKey: roundData.awayTeam,
      theme: roundData.theme,
      gameId: this.gameSettings.gameId,
      eventDetails: eventDetails.map((eventDetail) => eventDetail._id),
      scheduleStartTs: new Date(eventStartTimeTs),
      scheduleEndTs: new Date(eventStartTimeTs + wholeRound * 1000),
      eventConfig: {
        preloadDurationMs: preloadDuration * 1000,
      },
    };

    return this.eventRepository.create(event);
  }

  async createNewEventDetails(eventId: number, startTime: Date, roundData: GameRunningRound): Promise<IEventDetail[]> {
    const timelines = roundData.matchConfig.gameTiming.timelines;

    return Promise.all(
      timelines.map((timeline, index) => {
        const eventDetail: EventDetail = {
          eventID: eventId,
          oddsAvailableTs: new Date(startTime.getTime() + timeline.OddsAvailable * 1000),
          scheduleStartTs: new Date(startTime.getTime() + timeline.ScheduleStart * 1000),
          resultsAvailableTs: new Date(startTime.getTime() + timeline.ResultAvailable * 1000),
          hasResults: false,
          phase: roundData.matchConfig.eventDetailInfos[index].phase,
        };

        return this.eventDetailsRepository.create(eventDetail);
      })
    );
  }

  async updateEventDetail(eventDetail: IEventDetail, fields?: (keyof IEventDetail)[]) {
    const updateFields = fields ? Object.fromEntries(fields.map((field) => [field, eventDetail[field]])) : eventDetail;
    await this.eventDetailsRepository.updateOne({ _id: eventDetail._id }, { $set: updateFields });
  }

  async fetchEvent(eventId: number): Promise<IEvent> {
    const event = await this.eventRepository.findOne({ eventID: eventId }).lean().exec();

    if (!event) {
      this.logService.logError(`Event not found for eventId ${eventId}`);
      throw new Error(`Event not found for eventId ${eventId}`);
    }

    return event;
  }

  async fetchEventWithRetries(eventId: number): Promise<IEvent> {
    const event = await retryHelper.retry(async () => this.eventRepository.findOne({ eventID: eventId }).lean().exec());

    if (!event) {
      this.logService.logError(`Event not found for eventId ${eventId}`);
      throw new Error(`Event not found for eventId ${eventId}`);
    }

    return event;
  }

  async fetchEventDetail(_id: Schema.Types.ObjectId): Promise<IEventDetail> {
    const eventDetail = await this.eventDetailsRepository.findOne({ _id }).lean().exec();

    if (!eventDetail) {
      this.logService.logError(`Event detail not found for _id ${_id}`);
      throw new Error(`Event detail not found for _id ${_id}`);
    }

    return eventDetail;
  }

  async fetchAllUpcomingEvents(): Promise<IEvent[]> {
    return this.eventRepository
      .find({ gameId: this.gameSettings.gameId, scheduleStartTs: { $gt: new Date() } }, "eventID")
      .lean()
      .exec();
  }
}
