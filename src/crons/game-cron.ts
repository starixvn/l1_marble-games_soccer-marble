import cron from "cron";
import { logger } from "sc-common";
import {
  AppContainer,
  Event,
  EventDetail,
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

type Draw = {
  drawIndex: number;
  odds: Record<string, number>;
  videoName: string;
  result: string;
};

type Round = {
  roundId: number;
  drawIndex: number;
  draws: Draw[];
  roundTime: number;
  homeTeam: string;
  awayTeam: string;
  numberOfDraws: number;
  matchConfig?: MatchConfigType;
  odds?: Record<string, number>[];
  result?: RoundResultType;
  settlementResult?: RoundSettlementResultType;
};
export default class GameCron {
  logService: typeof logger;
  gameSettings: GameSettings;
  rateConfigs: RateConfig[];
  round: Round;
  events: Event[];

  constructor(container: AppContainer) {
    this.logService = container.logService;
    this.gameSettings = container.gameSettings;
    this.rateConfigs = container.rateConfigs;
    this.round = {
      roundId: 0,
      drawIndex: 0,
      draws: [],
      roundTime: 0,
      homeTeam: "",
      awayTeam: "",
      numberOfDraws: this.gameSettings.gameTiming.timelines.length,
    };
    this.events = [];
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
      this.startNewRound();
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

  private updateOddsForDraw(drawIndex: number) {
    const event = this.events[this.events.length - 1];
    const eventDetail = event.eventDetails[drawIndex];
    const odds = this.round.draws[drawIndex].odds;

    Object.entries(odds).forEach(([betChoice, odds]) => {
      const selection: Selection = {
        name: betChoice,
        price: odds,
        point: 0,
        settlementStatus: SettlementStatus.PLAY,
      };

      eventDetail.selections?.push(selection);
    });
  }

  // TODO: update video info to database
  private updateVideoInfoForDraw(drawIndex: number) {}

  // TODO: update result to database
  private updateResultForDraw(drawIndex: number) {}

  private startNewRound() {
    this.round.roundTime = 0;
    this.round.roundId++;
    this.round.drawIndex = 0;

    const { homeTeam, awayTeam } = this.createNewMatch();
    this.round.homeTeam = homeTeam;
    this.round.awayTeam = awayTeam;

    this.createNewMatchConfig();
    this.generateRoundOddsAndUpdateMatchConfig();
    this.generateResult();
    this.getSettlementResult();
    this.updateSecondHalfOdds();
    this.handleCreateAndUpdateNewEvent(this.round);
  }

  private handleCreateAndUpdateNewEvent(round: Round) {
    const event = this.createNewEvent(round);
    this.events.push(event);
  }

  private createNewEvent(roundData: Round): Event {
    const eventDetails: EventDetail[] = [];
    for (let drawIndex = 0; drawIndex < roundData.numberOfDraws; drawIndex++) {
      eventDetails.push({
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
      });
    }

    const event: Event = {
      eventID: roundData.roundId,
      eventNameAKey: roundData.homeTeam,
      eventNameBKey: roundData.awayTeam,
      gameId: 104,
      eventDetails: eventDetails,
      startTime: new Date(),
      endTime: new Date(),
    };

    return event;
  }

  private createNewMatch() {
    const teams = secureShuffle(this.gameSettings.teams);
    const homeTeam = teams[0];
    const awayTeam = teams[1];

    return { homeTeam, awayTeam };
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
