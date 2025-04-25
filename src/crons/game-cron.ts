import cron from "cron";
import { logger } from "sc-common";
import {
  AppContainer,
  Event,
  Selection,
  SettlementStatus,
  GameSettings,
  RateConfig,
  MatchConfigType,
  RoundResultType,
  RoundSettlementResultType,
  DrawResultType,
  DrawSettlementResultType,
} from "../types";
import { calculateOddsForRound } from "../helpers/odds-helper";
import { securePickOne, secureShuffle } from "sc-core-rng";
import { generateResult, getSettlementResult } from "../helpers/result-helper";
import type { EventDetailModel, EventModel, RoundModel } from "../models";
import { IEventDetail } from "../models/event-details";
import { IRound } from "../models/rounds";

// Types
type Round = {
  roundId: number;
  roundTime: number;
  homeTeam: string;
  awayTeam: string;
  numberOfDraws: number;
  matchConfig?: MatchConfigType;
  selections?: Record<string, Selection>[];
  odds?: Record<string, number>[];
  result?: RoundResultType;
  settlementResult?: RoundSettlementResultType;
};

// Round Manager class to handle round-related operations
class RoundManager {
  constructor(private roundRepository: typeof RoundModel, private gameSettings: GameSettings) {}

  async initRoundId(): Promise<number> {
    const round = await this.roundRepository.findOne({ gameId: this.gameSettings.gameId }, "roundId", {
      sort: { roundId: -1 },
    });
    return round?.roundId ?? 0;
  }

  async getLastRound(roundId: number): Promise<IRound | null> {
    return await this.roundRepository.findOne({ gameId: this.gameSettings.gameId, roundId }).lean().exec();
  }

  async updateRoundEnded(roundId: number): Promise<void> {
    await this.roundRepository.updateOne({ roundId, gameId: this.gameSettings.gameId }, { $set: { ended: true } });
  }

  async createRound(round: any): Promise<void> {
    await this.roundRepository.create(round);
  }
}

// Event Manager class to handle event-related operations
class EventManager {
  constructor(
    private eventRepository: typeof EventModel,
    private eventDetailsRepository: typeof EventDetailModel,
    private gameSettings: GameSettings
  ) {}

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

    const createdEvent = (await this.eventRepository.create(event)).toObject();
    return {
      ...createdEvent,
      eventDetails,
    };
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

// Match Manager class to handle match-related operations
class MatchManager {
  constructor(private gameSettings: GameSettings, private rateConfigs: RateConfig[]) {}

  createNewMatch(): { homeTeam: string; awayTeam: string } {
    const teams = secureShuffle(this.gameSettings.teams);
    return {
      homeTeam: teams[0],
      awayTeam: teams[1],
    };
  }

  createNewMatchConfig(): MatchConfigType {
    return {
      firstHalf: securePickOne(this.rateConfigs),
      secondHalf: securePickOne(this.rateConfigs),
    };
  }

  generateRoundOddsAndUpdateMatchConfig(matchConfig: MatchConfigType) {
    return calculateOddsForRound(matchConfig);
  }

  generateResult(matchConfig: MatchConfigType, numberOfVideos: Record<string, number>) {
    return generateResult({
      numberOfVideos,
      matchConfig,
    });
  }

  getSettlementResult(result: RoundResultType, matchConfig: MatchConfigType) {
    return getSettlementResult(result, matchConfig);
  }

  updateSecondHalfOdds(odds: Record<string, number>[], settlementResult: RoundSettlementResultType) {
    const secondHalfOdds = { ...odds[1] };
    if (settlementResult[0].odd === SettlementStatus.WIN) {
      odds[1].odd = secondHalfOdds.even;
      odds[1].even = secondHalfOdds.odd;
    }
    return odds;
  }
}

// Main GameCron class
export class GameCron {
  private roundManager: RoundManager;
  private eventManager: EventManager;
  private matchManager: MatchManager;
  private round: Round;
  private event: Event;
  private lastRound?: IRound;
  private gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.roundManager = new RoundManager(container.roundRepository, this.gameSettings);
    this.eventManager = new EventManager(container.eventRepository, container.eventDetailsRepository, this.gameSettings);
    this.matchManager = new MatchManager(this.gameSettings, container.rateConfigs);

    this.round = {
      roundId: 0,
      roundTime: 0,
      homeTeam: "",
      awayTeam: "",
      numberOfDraws: this.gameSettings.gameTiming.timelines.length,
    };
    this.event = {} as Event;
  }

  async start() {
    try {
      await this.initRoundId();
      await this.getLastRound();
      await this.updateUnfinishedEvents();
      this.startCron();
    } catch (error) {
      console.log(error);
    }
  }

  private startCron() {
    const job = new cron.CronJob(
      "* * * * * *",
      () => this.proceed().catch(console.error),
      () => {
        console.error("Game cron job unexpectedly stopped because some other tasks halt it.");
        job.start();
      }
    );

    job.start();
  }

  private async proceed() {
    const currentRoundTime = this.round.roundTime;
    const { timelines, wholeRound } = this.gameSettings.gameTiming;

    if (currentRoundTime > wholeRound || this.round.roundTime === 0) {
      await this.roundManager.updateRoundEnded(this.round.roundId);
      await this.startNewRound();
    }

    await this.processTimelines(timelines, currentRoundTime);
    this.round.roundTime++;
  }

  private async processTimelines(timelines: any[], currentRoundTime: number) {
    for (const [drawIndex, timeline] of timelines.entries()) {
      if (currentRoundTime === timeline.OddsAvailable) {
        await this.updateOddsForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ScheduleStart) {
        await this.updateVideoInfoForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable) {
        await this.updateResultForDraw(drawIndex);
      }
    }
  }

  private async initRoundId() {
    this.round.roundId = await this.roundManager.initRoundId();
  }

  private async getLastRound() {
    const lastRound = await this.roundManager.getLastRound(this.round.roundId);
    if (lastRound) {
      this.lastRound = lastRound;
    }
  }

  private async startNewRound() {
    this.round.roundTime = 0;
    this.round.roundId++;

    const { homeTeam, awayTeam } = this.matchManager.createNewMatch();
    this.round.homeTeam = homeTeam;
    this.round.awayTeam = awayTeam;

    this.round.matchConfig = this.matchManager.createNewMatchConfig();

    const { odds, matchConfig, selections } = this.matchManager.generateRoundOddsAndUpdateMatchConfig(
      this.round.matchConfig
    );
    this.round.odds = odds;
    this.round.matchConfig = matchConfig;
    this.round.selections = selections;

    this.round.result = this.matchManager.generateResult(this.round.matchConfig, this.gameSettings.numberOfVideos);

    this.round.settlementResult = this.matchManager.getSettlementResult(this.round.result, this.round.matchConfig);

    this.round.odds = this.matchManager.updateSecondHalfOdds(this.round.odds!, this.round.settlementResult);

    this.event = await this.eventManager.createNewEvent(this.round);
    await this.createNewRound();
  }

  private async createNewRound() {
    try {
      const eventDetails = this.event.eventDetails.map((eventDetail: any) => eventDetail.toObject());

      eventDetails.forEach((eventDetail, drawIndex) => {
        eventDetail.selections = Object.values(this.round.selections![drawIndex]);
        eventDetail.result = this.round.result!.drawResults[drawIndex].result;
        eventDetail.playlist = this.round.result!.drawResults[drawIndex].playlist;
        eventDetail.goalInfo = this.round.result!.drawResults[drawIndex].goalInfo;
      });

      const newRound = {
        roundId: this.round.roundId,
        eventID: this.event.eventID,
        eventNameAKey: this.event.eventNameAKey,
        eventNameBKey: this.event.eventNameBKey,
        eventDetails: eventDetails,
        gameId: this.gameSettings.gameId,
        ended: false,
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + this.gameSettings.gameTiming.wholeRound * 1000),
      };

      await this.roundManager.createRound(newRound);
    } catch (error) {
      console.error(`Error creating new round: ${error}`);
      throw error;
    }
  }

  private async updateUnfinishedEvents() {
    if (this.lastRound && !this.lastRound.ended) {
      const currentDate = new Date();
      const eventDetails = this.lastRound.eventDetails;

      if (currentDate > this.lastRound.endTime) {
        await this.roundManager.updateRoundEnded(this.lastRound.roundId);
        await this.updateAllEventDetails(eventDetails);
      } else {
        await this.updateEventDetailsByTimeline(eventDetails, currentDate);
        await this.updateRoundFromLastRound();
      }
    }
  }

  private async updateAllEventDetails(eventDetails: any[]) {
    for (const eventDetail of eventDetails) {
      const eventDetailWithId = eventDetail as unknown as IEventDetail;
      if (eventDetailWithId._id) {
        await this.eventManager.updateEventDetail(eventDetailWithId);
      }
    }
  }

  private async updateEventDetailsByTimeline(eventDetails: any[], currentDate: Date) {
    for (const eventDetail of eventDetails) {
      const eventDetailWithId = eventDetail as unknown as IEventDetail;
      if (!eventDetailWithId._id) continue;

      if (eventDetail.oddsAvailableTs < currentDate) {
        await this.eventManager.updateEventDetail(eventDetailWithId, ["selections"]);
      }

      if (eventDetail.scheduleStartTs < currentDate) {
        await this.eventManager.updateEventDetail(eventDetailWithId, ["playlist", "goalInfo"]);
      }

      if (eventDetail.resultsAvailableTs < currentDate) {
        await this.eventManager.updateEventDetail(eventDetailWithId, ["result"]);
      }
    }
  }

  private async updateRoundFromLastRound() {
    const drawResults = this.lastRound!.eventDetails.map((eventDetail) => ({
      result: eventDetail.result || "",
      playlist: eventDetail.playlist || "",
      goalInfo: eventDetail.goalInfo || "",
    })) as DrawResultType[];

    const settlementResult = this.lastRound!.eventDetails.map((eventDetail) => {
      const drawSettlementResult: DrawSettlementResultType = {};
      eventDetail.selections!.forEach((selection) => {
        drawSettlementResult[selection.name] = selection.settlementStatus;
      });
      return drawSettlementResult;
    });

    const eventSelections = this.lastRound!.eventDetails.map((eventDetail) => {
      const eventDetailSelections = {} as Record<string, Selection>;
      eventDetail.selections!.forEach((selection) => {
        eventDetailSelections[selection.name] = selection;
      });
      return eventDetailSelections;
    });

    this.round = {
      roundId: this.lastRound!.roundId,
      roundTime: Math.round((new Date().getTime() - this.lastRound!.startTime.getTime()) / 1000),
      homeTeam: this.lastRound!.eventNameAKey,
      awayTeam: this.lastRound!.eventNameBKey,
      numberOfDraws: this.lastRound!.eventDetails.length,
      result: { drawResults },
      settlementResult,
      selections: eventSelections,
    };

    this.event = this.lastRound!;
  }

  private async updateOddsForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.selections = Object.values(this.round.selections![drawIndex]);
    await this.eventManager.updateEventDetail(eventDetail, ["selections"]);
  }

  private async updateVideoInfoForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.playlist = this.round.result!.drawResults[drawIndex].playlist;
    eventDetail.goalInfo = this.round.result!.drawResults[drawIndex].goalInfo;
    await this.eventManager.updateEventDetail(eventDetail, ["playlist", "goalInfo"]);
  }

  private async updateResultForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex] as unknown as IEventDetail;
    if (!eventDetail._id) return;

    eventDetail.result = this.round.result!.drawResults[drawIndex].result;
    eventDetail.selections!.forEach((selection) => {
      selection.settlementStatus = this.round.settlementResult![drawIndex][selection.name];
    });
    await this.eventManager.updateEventDetail(eventDetail, ["result"]);
  }
}
