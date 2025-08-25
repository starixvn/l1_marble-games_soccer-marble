import {
  RoundResultType,
  MatchConfigType,
  GameRunningRound,
  GameSettings,
  AppContainer,
  Match,
  HalfConfigType,
  RateConfig,
  Timeline,
} from "../types";
import { secureShuffle, secureRandomBool, secureRandomRange, securePickOne } from "sc-core-rng";
import { calculateOddsForRound, mergeArrayOfRates } from "../helpers/odds-helper";
import { generateResult, getSettlementResult } from "../helpers/result-helper";
import { encrypt } from "../helpers/crypto-helper";
import { idHelper } from "../helpers";
import { rateConfigs } from "../game-config";
import { GameData } from "../crons/game-data";

const minBlocks = 2;
const maxBlocks = 4;
const minVideoLength = 6;

export class RoundGeneratorService {
  private readonly gameSettings: GameSettings;
  private readonly rateConfigs: typeof rateConfigs;
  private readonly gameData: GameData;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.rateConfigs = container.rateConfigs;
    this.gameData = container.gameData;
  }

  createNewMatchFromRandomTeams() {
    const teams = this.gameData.gameConfig?.config?.teams?.length
      ? this.gameData.gameConfig?.config?.teams
      : this.gameSettings.teams;
    const [homeTeam, awayTeam] = secureShuffle(teams);
    return { homeTeam, awayTeam, theme: this.gameSettings.theme };
  }

  createNewMatchFromMatches(roundId: number) {
    const teams = this.gameData.gameConfig?.config?.teams?.length
      ? this.gameData.gameConfig?.config?.teams
      : this.gameSettings.teams;
    const matches = this.gameData.gameConfig?.config?.matches;

    if (!matches || matches.length === 0) {
      return this.createNewMatchFromRandomTeams();
    }

    const match = matches[roundId % matches.length];

    if (!teams.includes(match.homeTeam) || !teams.includes(match.awayTeam)) {
      return this.createNewMatchFromRandomTeams();
    }

    match.theme = match.theme ?? this.gameSettings.theme;

    return match;
  }

  createNewMatch(roundId: number): Match {
    const teamSelectionMode = this.gameData.gameConfig?.config?.teamSelectionMode ?? 1;

    if (teamSelectionMode === 2) {
      return this.createNewMatchFromMatches(roundId);
    }

    return this.createNewMatchFromRandomTeams();
  }

  createNewMatchConfig(): MatchConfigType {
    const firstHalfBlock = secureRandomRange(minBlocks, maxBlocks);
    const secondHalfBlock = secureRandomRange(minBlocks, maxBlocks);
    const isHomeFavorite = secureRandomBool();
    const firstHalfRates: RateConfig[] = [];
    const gameTiming = this.gameSettings.gameTiming;
    const firstHalfMaxVideoLength = Math.round(gameTiming.videoLength / firstHalfBlock);
    const secondHalfMaxVideoLength = Math.round(gameTiming.videoLength / secondHalfBlock);
    let lastFirstHalfVideoLength = gameTiming.videoLength;
    let lastSecondHalfVideoLength = gameTiming.videoLength;
    const firstHalfVideosLength = [];
    const secondHalfVideosLength = [];
    const firstHalfTimelines: Timeline[] = [];
    const secondHalfTimelines: Timeline[] = [];

    for (let i = 1; i < firstHalfBlock; i++) {
      firstHalfRates.push(
        isHomeFavorite ? securePickOne(this.rateConfigs.homeFavorite) : securePickOne(this.rateConfigs.awayFavorite)
      );

      const videoLength = secureRandomRange(minVideoLength, firstHalfMaxVideoLength);
      firstHalfVideosLength.push(videoLength);
      lastFirstHalfVideoLength -= videoLength;
    }

    firstHalfRates.push(isHomeFavorite ? this.rateConfigs.homeFavoriteDraw[0] : this.rateConfigs.awayFavoriteDraw[0]);
    firstHalfVideosLength.push(lastFirstHalfVideoLength);

    const secondHalfRates: RateConfig[] = [];
    for (let i = 1; i < secondHalfBlock; i++) {
      secondHalfRates.push(
        isHomeFavorite ? securePickOne(this.rateConfigs.homeFavorite) : securePickOne(this.rateConfigs.awayFavorite)
      );

      const videoLength = secureRandomRange(minVideoLength, secondHalfMaxVideoLength);
      secondHalfVideosLength.push(videoLength);
      lastSecondHalfVideoLength -= videoLength;
    }

    secondHalfRates.push(isHomeFavorite ? this.rateConfigs.homeFavoriteDraw[0] : this.rateConfigs.awayFavoriteDraw[0]);
    secondHalfVideosLength.push(lastSecondHalfVideoLength);

    firstHalfVideosLength.forEach((videoLength, index) => {
      const oddsAvailable = index === 0 ? 0 : firstHalfTimelines[index - 1].ScheduleStart;
      const scheduleStart =
        index === 0 ? gameTiming.oddsLength : firstHalfTimelines[index - 1].ResultAvailable + gameTiming.breakTime;
      const resultAvailable = scheduleStart + videoLength;

      const timeline = {
        OddsAvailable: oddsAvailable,
        ScheduleStart: scheduleStart,
        ResultAvailable: resultAvailable,
      };

      firstHalfTimelines.push(timeline);
    });

    secondHalfVideosLength.forEach((videoLength, index) => {
      const oddsAvailable =
        index === 0
          ? firstHalfTimelines[firstHalfTimelines.length - 1].ResultAvailable
          : secondHalfTimelines[index - 1].ScheduleStart;

      const scheduleStart =
        index === 0
          ? oddsAvailable + gameTiming.halfTime
          : secondHalfTimelines[index - 1].ResultAvailable + gameTiming.breakTime;

      const resultAvailable = scheduleStart + videoLength;

      const timeline = {
        OddsAvailable: oddsAvailable,
        ScheduleStart: scheduleStart,
        ResultAvailable: resultAvailable,
      };

      secondHalfTimelines.push(timeline);
    });

    const timelines = [...firstHalfTimelines, ...secondHalfTimelines];

    return {
      timelines,
      firstHalf: {
        numberOfEventDetails: firstHalfBlock,
        eventDetailScoreRates: firstHalfRates,
        scoreRate: mergeArrayOfRates(firstHalfRates).scoreRate,
      } as HalfConfigType,
      secondHalf: {
        numberOfEventDetails: secondHalfBlock,
        eventDetailScoreRates: secondHalfRates,
        scoreRate: mergeArrayOfRates(secondHalfRates).scoreRate,
      } as HalfConfigType,
    } as MatchConfigType;
  }

  generateRoundOddsAndUpdateMatchConfig(matchConfig: MatchConfigType, result: RoundResultType) {
    return calculateOddsForRound(matchConfig, result);
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

  generateNewRound(roundId: number) {
    const newRound = {
      gameId: this.gameSettings.gameId,
      eventID: idHelper.createEventId(this.gameSettings.gameId, roundId),
      roundId,
      ended: false,
    } as GameRunningRound;

    const { homeTeam, awayTeam, theme } = this.createNewMatch(roundId);
    newRound.homeTeam = homeTeam;
    newRound.awayTeam = awayTeam;
    newRound.theme = theme;

    newRound.matchConfig = this.createNewMatchConfig();

    const numberOfVideos = this.gameData.gameConfig?.config?.numberOfVideos ?? this.gameSettings.numberOfVideos;

    const result = this.generateResult(newRound.matchConfig, numberOfVideos);

    const { odds, matchConfigs, selections } = this.generateRoundOddsAndUpdateMatchConfig(newRound.matchConfig, result);

    newRound.odds = odds;
    newRound.oddsConfigs = matchConfigs;

    const settlementResult = "";

    newRound.encryptedResult = encrypt(result);
    newRound.encryptedSettlementResult = encrypt(settlementResult);
    newRound.encryptedSelections = encrypt(selections);

    return newRound;
  }
}
