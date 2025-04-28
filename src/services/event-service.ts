import { Round } from "../crons/game-cron";
import { EventModel } from "../models";
import { EventDetailModel } from "../models";
import { IEventDetail } from "../models/event-details";
import { GameSettings, Event, AppContainer, EventDetail } from "../types";

// Event Manager class to handle event-related operations
export class EventService {
  private eventRepository: typeof EventModel;
  private eventDetailsRepository: typeof EventDetailModel;
  private gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.eventRepository = container.eventRepository;
    this.eventDetailsRepository = container.eventDetailsRepository;
    this.gameSettings = container.gameSettings;
  }

  async createNewEvent(roundData: Round): Promise<Event> {
    const eventDetails = await this.createNewEventDetails(roundData);

    const event = {
      eventID: roundData.roundId,
      eventNameAKey: roundData.homeTeam,
      eventNameBKey: roundData.awayTeam,
      gameId: this.gameSettings.gameId,
      eventDetails: eventDetails.map((eventDetail) => eventDetail._id),
      scheduleStartTs: new Date(),
      scheduleEndTs: new Date(new Date().getTime() + this.gameSettings.gameTiming.wholeRound * 1000),
    };

    const createdEvent = await this.eventRepository.create(event);

    return { ...createdEvent.toObject(), eventDetails };
  }

  private async createNewEventDetails(roundData: Round): Promise<IEventDetail[]> {
    const { timelines } = this.gameSettings.gameTiming;
    return Promise.all(
      timelines.map((timeline) => {
        const eventDetail: EventDetail = {
          eventID: roundData.roundId,
          oddsAvailableTs: new Date(Date.now() + timeline.OddsAvailable * 1000),
          scheduleStartTs: new Date(Date.now() + timeline.ScheduleStart * 1000),
          resultsAvailableTs: new Date(Date.now() + timeline.ResultAvailable * 1000),
          hasResult: false,
        };

        return this.eventDetailsRepository.create(eventDetail) as unknown as IEventDetail;
      })
    );
  }

  async updateEventDetail(eventDetail: IEventDetail, fields?: (keyof IEventDetail)[]) {
    const updateFields = fields ? Object.fromEntries(fields.map((field) => [field, eventDetail[field]])) : eventDetail;
    await this.eventDetailsRepository.updateOne({ _id: eventDetail._id }, { $set: updateFields });
  }
}
