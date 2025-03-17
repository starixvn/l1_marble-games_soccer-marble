import { shuffle } from "./../helpers/shuffle";
import cron from "cron";
import { logger } from "sc-common";
import { AppContainer, Event } from "../types";
import { GameSettings } from "../config/game-settings";

type RoundData = {
  roundId: number;
  drawIndex: number;
  odds: Record<string, number>;
  videoName: string;
  result: string;
  roundTime: number;
  homeTeam: string;
  awayTeam: string;
};

export default class GameCron {
  logService: typeof logger;
  gameSettings: GameSettings;
  roundData: RoundData;
  events: Event[];

  constructor(container: AppContainer) {
    this.logService = container.logService;
    this.gameSettings = container.gameSettings;
    this.roundData = {
      roundId: 0,
      drawIndex: 0,
      odds: {},
      videoName: "",
      result: "",
      roundTime: 0,
      homeTeam: "",
      awayTeam: "",
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
    const currentRoundTime = this.roundData.roundTime;
    const { timelines, wholeRound } = this.gameSettings.duration;

    if (currentRoundTime > wholeRound) {
      this.startNewRound();
    }

    timelines.forEach((timeline, drawIndex) => {
      if (currentRoundTime === timeline.oddsAvailable) {
        this.updateOddsForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.videoInfoAvailable) {
        this.updateVideoInfoForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.resultAvailable) {
        this.updateResultForDraw(drawIndex);
      }
    });

    this.roundData.roundTime++;
  }

  // TODO: update odds to database
  private updateOddsForDraw(drawIndex: number) {}

  // TODO: update video info to database
  private updateVideoInfoForDraw(drawIndex: number) {}

  // TODO: update result to database
  private updateResultForDraw(drawIndex: number) {}

  private startNewRound() {
    this.roundData.roundTime = 0;
    this.roundData.roundId++;
    this.roundData.drawIndex = 0;

    const { homeTeam, awayTeam } = this.createNewMatch();
    this.roundData.homeTeam = homeTeam;
    this.roundData.awayTeam = awayTeam;

    this.generateRoundResult();
  }

  private createNewMatch() {
    const teams = shuffle(this.gameSettings.teams);
    const homeTeam = teams[0];
    const awayTeam = teams[1];

    return { homeTeam, awayTeam };
  }

  // TODO: generate round result
  private generateRoundResult() {}
}
