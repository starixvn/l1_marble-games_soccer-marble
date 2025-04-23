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
    this.startCron();
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
      await this.startNewRound();
    }

    timelines.forEach((timeline, drawIndex) => {
      if (currentRoundTime === timeline.OddsAvailable) {
        this.updateOddsForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ScheduleStart) {
        this.updateVideoInfoForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable) {
        this.updateResultForDraw(drawIndex);
      }
    });

    this.round.roundTime++;
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

    await this.updateEventDetail(eventDetail as unknown as IEventDetail);
  }

  private async updateEventDetail(eventDetail: IEventDetail) {
    await this.eventDetailsRepository.updateOne({ _id: eventDetail._id }, { $set: eventDetail });
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
  }

  private async handleCreateAndUpdateNewEvent(round: Round) {
    await this.createNewEvent(round);
  }

  private async createNewEvent(roundData: Round) {
    const eventDetails = await this.createNewEventDetails(roundData);

    const event = await this.eventRepository.create({
      eventID: roundData.roundId,
      eventNameAKey: roundData.homeTeam,
      eventNameBKey: roundData.awayTeam,
      gameId: this.gameSettings.gameId,
      eventDetails: eventDetails.map((eventDetail) => eventDetail._id),
      startTime: new Date(),
      endTime: new Date(),
    });

    this.event = {
      ...event,
      eventDetails: eventDetails,
    };
  }

  private async createNewEventDetails(roundData: Round): Promise<IEventDetail[]> {
    const eventDetails: IEventDetail[] = [];

    for (let drawIndex = 0; drawIndex < roundData.numberOfDraws; drawIndex++) {
      const eventDetail = await this.eventDetailsRepository.create({
        eventId: roundData.roundId,
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
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
