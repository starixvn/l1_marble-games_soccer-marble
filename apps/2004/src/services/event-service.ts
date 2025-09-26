import { EventService as BaseEventService } from "@soccer-marble/soccer-marble-base";
import type { EventDetail, GameRunningRound as BaseGameRunningRound } from "@soccer-marble/soccer-marble-base";
import type { GameRunningRound, HalfConfigType } from "../types";
import { IEventDetail } from "@soccer-marble/soccer-marble-base/dist/models/event-details";

export class EventService extends BaseEventService {
  override async createNewEventDetails(
    eventId: number,
    startTime: Date,
    roundData: BaseGameRunningRound
  ): Promise<IEventDetail[]> {
    const appRoundData = roundData as unknown as GameRunningRound;
    const timelines = roundData.matchConfig.gameTiming.timelines;
    const firstHalfNumberOfEventDetails = (appRoundData.matchConfig.firstHalf as HalfConfigType).numberOfEventDetails;

    return Promise.all(
      timelines.map((timeline, index) => {
        const eventDetail: EventDetail = {
          eventID: eventId,
          oddsAvailableTs: new Date(startTime.getTime() + timeline.OddsAvailable * 1000),
          scheduleStartTs: new Date(startTime.getTime() + timeline.ScheduleStart * 1000),
          resultsAvailableTs: new Date(startTime.getTime() + timeline.ResultAvailable * 1000),
          hasResults: false,
          phase: index < firstHalfNumberOfEventDetails ? 0 : 1,
        };

        return this.eventDetailsRepository.create(eventDetail);
      })
    );
  }
}
