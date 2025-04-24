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
} from "../types";
import { calculateOddsForRound } from "../helpers/odds-helper";
import { securePickOne, secureShuffle } from "sc-core-rng";
import { generateResult, getSettlementResult } from "../helpers/result-helper";
import type { EventDetailModel, EventModel, RoundModel } from "../models";
import { IEventDetail } from "../models/event-details";

type Draw = {
  drawIndex: number;
  odds: Record<string, number>;
  videoName: string;
  result: string;
};

type Round = {
  roundId: number;
  drawIndex: number;
  roundTime: number;
  homeTeam: string;
  awayTeam: string;
  numberOfDraws: number;
  matchConfig?: MatchConfigType;
  odds?: Record<string, number>[];
  result?: RoundResultType;
  settlementResult?: RoundSettlementResultType;
};
export class GameCron {
  logService: typeof logger;
  gameSettings: GameSettings;
  rateConfigs: RateConfig[];
  round: Round;
  event: Event;
  eventDetailsRepository: typeof EventDetailModel;
  eventRepository: typeof EventModel;
  roundRepository: typeof RoundModel;

  constructor(container: AppContainer) {
    this.logService = container.logService;
    this.gameSettings = container.gameSettings;
    this.rateConfigs = container.rateConfigs;
    this.round = {
      roundId: 0,
      drawIndex: 0,
      roundTime: 0,
      homeTeam: "",
      awayTeam: "",
      numberOfDraws: this.gameSettings.gameTiming.timelines.length,
    };
    this.event = {} as Event;
    this.eventDetailsRepository = container.eventDetailsRepository;
    this.eventRepository = container.eventRepository;
    this.roundRepository = container.roundRepository;
  }

  async start() {
    try {
      await this.getLastRound();
      this.startCron();
    } catch (error) {
      console.log(error);
    }
  }

  private startCron() {
    const job = new cron.CronJob(
      "* * * * * *",
      () => this.proceed().catch(this.logService.logError),
      () => {
        this.logService.logError(`Game cron job unexpectedly stopped because some other tasks halt it.`);
        job.start();
      }
    );

    job.start();
  }

  private async proceed() {
    const currentRoundTime = this.round.roundTime;
    const { timelines, wholeRound } = this.gameSettings.gameTiming;

    if (currentRoundTime > wholeRound || currentRoundTime === 0) {
      await this.updateRoundEnded();
      await this.startNewRound();
    }

    timelines.forEach(async (timeline, drawIndex) => {
      if (currentRoundTime === timeline.OddsAvailable) {
        console.log(`updateOddsForDraw ${drawIndex} with time ${new Date()}`);
        await this.updateOddsForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ScheduleStart) {
        console.log(`updateVideoInfoForDraw ${drawIndex} with time ${new Date()}`);
        await this.updateVideoInfoForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable) {
        console.log(`updateResultForDraw ${drawIndex} with time ${new Date()}`);
        await this.updateResultForDraw(drawIndex);
      }
    });

    this.round.roundTime++;
  }

  private async updateRoundEnded() {
    await this.roundRepository.updateOne(
      { roundId: this.round.roundId, gameId: this.gameSettings.gameId },
      { $set: { ended: true } }
    );
  }

  private async updateOddsForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex];
    const odds = this.round.odds![drawIndex];

    Object.entries(odds).forEach(([betChoice, odds]) => {
      const selection: Selection = {
        name: betChoice,
        price: odds,
        point: 0,
        settlementStatus: SettlementStatus.PLAY,
      };

      eventDetail.selections!.push(selection);
    });

    await this.updateEventDetail(eventDetail as unknown as IEventDetail);
  }

  private async updateVideoInfoForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex];

    eventDetail.playlist = this.round.result!.drawResults[drawIndex].playlist;
    eventDetail.goalInfo = this.round.result!.drawResults[drawIndex].goalInfo;

    await this.updateEventDetail(eventDetail as unknown as IEventDetail);
  }

  private async updateResultForDraw(drawIndex: number) {
    const eventDetail = this.event.eventDetails[drawIndex];

    eventDetail.result = this.round.result!.drawResults[drawIndex].result;

    eventDetail.selections!.forEach((selection) => {
      selection.settlementStatus = this.round.settlementResult![drawIndex][selection.name];
    });

    await this.updateEventDetail(eventDetail as unknown as IEventDetail);
  }

  private async updateEventDetail(eventDetail: IEventDetail) {
    await this.eventDetailsRepository.updateOne({ _id: eventDetail._id }, { $set: eventDetail });
  }

  private async getLastRound() {
    const round = await this.roundRepository.findOne({ gameId: this.gameSettings.gameId }, "roundId", {
      sort: { roundId: -1 },
    });
    console.log("last round", round);
    this.round.roundId = round?.roundId ?? 0;
  }

  private async startNewRound() {
    this.round.roundTime = 0;
    this.round.roundId++;
    this.round.drawIndex = 0;

    this.createNewMatch();
    this.createNewMatchConfig();
    this.generateRoundOddsAndUpdateMatchConfig();
    this.generateResult();
    this.getSettlementResult();
    this.updateSecondHalfOdds();
    await this.handleCreateAndUpdateNewEvent(this.round);
    await this.createNewRound();
  }

  private async handleCreateAndUpdateNewEvent(round: Round) {
    await this.createNewEvent(round);
  }

  private async createNewEvent(roundData: Round) {
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

    this.event = {
      ...event,
      eventDetails: eventDetails,
    };

    await this.eventRepository.create(event);
  }

  private async createNewRound() {
    try {
      console.log("createNewRound", JSON.stringify(this.event));

      // Check if round already exists
      const existingRound = await this.roundRepository.findOne({
        gameId: this.gameSettings.gameId,
        roundId: this.round.roundId,
      });

      if (existingRound) {
        console.log(`Round ${this.round.roundId} already exists`);
        return;
      }

      // Create new round with all required fields
      const newRound = {
        roundId: this.round.roundId,
        eventID: this.event.eventID,
        eventNameAKey: this.event.eventNameAKey,
        eventNameBKey: this.event.eventNameBKey,
        eventDetails: this.event.eventDetails,
        gameId: this.gameSettings.gameId,
        ended: false,
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + this.gameSettings.gameTiming.wholeRound * 1000),
      };

      await this.roundRepository.create(newRound);
      console.log(`Created new round ${this.round.roundId}`);
    } catch (error) {
      console.log(`Error creating new round: ${error}`);
      throw error;
    }
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

  private createNewMatch() {
    const teams = secureShuffle(this.gameSettings.teams);

    this.round.homeTeam = teams[0];
    this.round.awayTeam = teams[1];
  }

  private generateRoundOddsAndUpdateMatchConfig() {
    const { odds, matchConfig } = calculateOddsForRound(this.round.matchConfig!);
    this.round.odds = odds;
    this.round.matchConfig = matchConfig;
  }

  private generateResult() {
    const resultData = {
      numberOfVideos: this.gameSettings.numberOfVideos,
      matchConfig: this.round.matchConfig!,
    };

    this.round.result = generateResult(resultData);
  }

  private createNewMatchConfig() {
    this.round.matchConfig = {
      firstHalf: securePickOne(this.rateConfigs),
      secondHalf: securePickOne(this.rateConfigs),
    };
  }

  private getSettlementResult() {
    this.round.settlementResult = getSettlementResult(this.round.result!, this.round.matchConfig!);
  }

  private updateSecondHalfOdds() {
    const secondHalfOdds = { ...this.round.odds![1] };
    if (this.round.settlementResult![0].odd === SettlementStatus.WIN) {
      this.round.odds![1].odd = secondHalfOdds.even;
      this.round.odds![1].even = secondHalfOdds.odd;
    }
  }
}
