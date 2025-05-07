import { Schema } from "mongoose";
import { EventModel, EventDetailModel } from "../models";
import { IEventDetail } from "../models/event-details";
import { IEvent } from "../models/events";
import { GameSettings, AppContainer, EventDetail, GameRunningRound } from "../types";
import { logger } from "sc-common";

export class EventService {
  private readonly eventRepository: typeof EventModel;
  private readonly eventDetailsRepository: typeof EventDetailModel;
  private readonly gameSettings: GameSettings;
  private readonly logService: typeof logger;

  constructor(container: AppContainer) {
    this.eventRepository = container.eventRepository;
    this.eventDetailsRepository = container.eventDetailsRepository;
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
  }

  async createNewEvent(roundData: GameRunningRound, offsetFromCurrent: number) {
    const currentTime = new Date();
    const timeIncrement = this.gameSettings.gameTiming.wholeRound * (offsetFromCurrent - 1) - 1;
    const startTime = new Date(currentTime.getTime() + timeIncrement * 1000);

    const eventDetails = await this.createNewEventDetails(roundData.roundId, startTime);

    const event = {
      eventID: roundData.roundId,
      eventNameAKey: roundData.homeTeam,
      eventNameBKey: roundData.awayTeam,
      gameId: this.gameSettings.gameId,
      eventDetails: eventDetails.map((eventDetail) => eventDetail._id),
      scheduleStartTs: startTime,
      scheduleEndTs: new Date(startTime.getTime() + this.gameSettings.gameTiming.wholeRound * 1000),
    };

    return await this.eventRepository.create(event);
  }

  private async createNewEventDetails(eventId: number, startTime: Date): Promise<IEventDetail[]> {
    const { timelines } = this.gameSettings.gameTiming;
    return Promise.all(
      timelines.map((timeline) => {
        const eventDetail: EventDetail = {
          eventID: eventId,
          oddsAvailableTs: new Date(startTime.getTime() + timeline.OddsAvailable * 1000),
          scheduleStartTs: new Date(startTime.getTime() + timeline.ScheduleStart * 1000),
          resultsAvailableTs: new Date(startTime.getTime() + timeline.ResultAvailable * 1000),
          hasResult: false,
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

  async fetchEventDetail(_id: Schema.Types.ObjectId): Promise<IEventDetail> {
    const eventDetail = await this.eventDetailsRepository.findOne({ _id }).lean().exec();

    if (!eventDetail) {
      this.logService.logError(`Event detail not found for _id ${_id}`);
      throw new Error(`Event detail not found for _id ${_id}`);
    }

    return eventDetail;
  }

  async fetchAllUpcomingEvents() {
    return await this.eventRepository
      .find({ gameId: this.gameSettings.gameId, scheduleStartTs: { $gt: new Date() } }, "eventID")
      .lean()
      .exec();
  }
}
