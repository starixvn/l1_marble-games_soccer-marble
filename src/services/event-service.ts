import { Round } from "../crons/game-cron";
import { EventModel } from "../models";
import { EventDetailModel } from "../models";
import { IEventDetail } from "../models/event-details";
import { GameSettings, Event, AppContainer } from "../types";

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
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + this.gameSettings.gameTiming.wholeRound * 1000),
    };

    const createdEvent = await this.eventRepository.create(event);

    return { ...createdEvent.toObject(), eventDetails };
  }

  private async createNewEventDetails(roundData: Round): Promise<IEventDetail[]> {
    const eventDetails: IEventDetail[] = [];

    for (let drawIndex = 0; drawIndex < roundData.numberOfDraws; drawIndex++) {
      const eventDetail = await this.eventDetailsRepository.create({
        eventId: roundData.roundId,
        oddsAvailableTs: new Date(
          new Date().getTime() + this.gameSettings.gameTiming.timelines[drawIndex].OddsAvailable * 1000
        ),
        scheduleStartTs: new Date(
          new Date().getTime() + this.gameSettings.gameTiming.timelines[drawIndex].ScheduleStart * 1000
        ),
        resultsAvailableTs: new Date(
          new Date().getTime() + this.gameSettings.gameTiming.timelines[drawIndex].ResultAvailable * 1000
        ),
      });

      eventDetails.push(eventDetail as unknown as IEventDetail);
    }

    return eventDetails;
  }

  async updateEventDetail(eventDetail: IEventDetail, fieldsToUpdate?: (keyof IEventDetail)[]) {
    if (!fieldsToUpdate) {
      await this.eventDetailsRepository.updateOne({ _id: eventDetail._id }, { $set: eventDetail });
      return;
    }

    const updateObject: Record<string, any> = {};
    fieldsToUpdate.forEach((field) => {
      if (field in eventDetail) {
        updateObject[field] = eventDetail[field];
      }
    });

    await this.eventDetailsRepository.updateOne({ _id: eventDetail._id }, { $set: updateObject });
  }
}
