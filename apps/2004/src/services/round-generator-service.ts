import { RoundGeneratorService as BaseRoundGeneratorService, oddsHelper } from "@soccer-marble/soccer-marble-base";
import type { RateConfig, Timeline, MatchConfigType } from "@soccer-marble/soccer-marble-base";
import { secureRandomRange, secureRandomBool, securePickOne } from "sc-core-rng";
import { GameRunningRound, GameTiming, MatchConfigsDetailType, RoundResultType } from "../types";
import { ResultGeneratorService } from "./result-generator-service";
import { idHelper, cryptoHelper } from "@soccer-marble/shared-utils";
import { OddsGeneratorService } from "./odds-generator-service";

const minBlocks = 2;
const maxBlocks = 4;
const minVideoLength = 6;

export class RoundGeneratorService extends BaseRoundGeneratorService {
  declare resultGeneratorService: ResultGeneratorService;
  declare oddsGeneratorService: OddsGeneratorService;

  override createNewMatchConfig(): MatchConfigType {
    const firstHalfBlock = secureRandomRange(minBlocks, maxBlocks);
    const secondHalfBlock = secureRandomRange(minBlocks, maxBlocks);
    const isHomeFavorite = secureRandomBool();
    const firstHalfRates: RateConfig[] = [];
    const gameTiming = this.gameSettings.gameTiming as unknown as GameTiming;
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
    gameTiming.timelines = timelines;

    return {
      gameTiming,
      numberOfEventDetails: firstHalfBlock + secondHalfBlock,
      firstHalf: {
        numberOfEventDetails: firstHalfBlock,
        eventDetailScoreRates: firstHalfRates,
        scoreRate: oddsHelper.mergeArrayOfRates(firstHalfRates).scoreRate,
      } as any,
      secondHalf: {
        numberOfEventDetails: secondHalfBlock,
        eventDetailScoreRates: secondHalfRates,
        scoreRate: oddsHelper.mergeArrayOfRates(secondHalfRates).scoreRate,
      } as any,
    } as any;
  }

  getSettlementResultForUltraLive(result: RoundResultType, matchConfigsDetailType: MatchConfigsDetailType) {
    return this.resultGeneratorService.getSettlementResultForUltraLive(result, matchConfigsDetailType);
  }

  generateRoundOddsAndUpdateMatchConfig(matchConfig: MatchConfigType, result: RoundResultType) {
    return this.oddsGeneratorService.calculateOddsForRound(matchConfig, result);
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

    const result = this.resultGeneratorService.generateResult({
      matchConfig: newRound.matchConfig,
      numberOfVideos: numberOfVideos,
    });

    const { odds, matchConfigs, selections } = this.generateRoundOddsAndUpdateMatchConfig(newRound.matchConfig, result);

    newRound.odds = odds;
    newRound.matchConfigsDetail = matchConfigs;

    const settlementResult = this.getSettlementResultForUltraLive(result, matchConfigs);

    newRound.encryptedResult = cryptoHelper.encrypt(result);
    newRound.encryptedSettlementResult = cryptoHelper.encrypt(settlementResult);
    newRound.encryptedSelections = cryptoHelper.encrypt(selections);

    return newRound as any;
  }
}
