import { RoundGeneratorService as BaseRoundGeneratorService, oddsHelper } from "@soccer-marble/soccer-marble-base";
import type {
  RateConfig,
  Timeline,
  MatchConfig,
  GameRunningRound,
  EventDetailResult,
} from "@soccer-marble/soccer-marble-base";
import { secureRandomBool, securePickOne, secureWeightedPick } from "sc-core-rng";
import { GameTiming } from "../types";
import { ResultGeneratorService } from "./result-generator-service";
import { idHelper, encrypt } from "@soccer-marble/shared-utils";
import { OddsGeneratorService } from "./odds-generator-service";
export class RoundGeneratorService extends BaseRoundGeneratorService {
  declare resultGeneratorService: ResultGeneratorService;
  declare oddsGeneratorService: OddsGeneratorService;

  generateRateConfigsForPhase(isHomeFavorite: boolean, size: number): RateConfig[] {
    const rateConfigs = Array.from({ length: size - 1 }, () =>
      isHomeFavorite ? securePickOne(this.rateConfigs.homeFavorite) : securePickOne(this.rateConfigs.awayFavorite)
    );

    rateConfigs.push(
      securePickOne(isHomeFavorite ? this.rateConfigs.homeFavoriteDraw : this.rateConfigs.awayFavoriteDraw)
    );

    return rateConfigs as RateConfig[];
  }

  generateTimelineForFirstHalf(videoLengths: number[]): Timeline[] {
    const gameTiming = this.gameSettings.gameTiming as GameTiming;

    const timelines: Timeline[] = [];

    for (let index = 0; index < videoLengths.length; index++) {
      const currentVideoLength = videoLengths[index];

      const oddsAvailable =
        index === 0 ? 0 : timelines[index - 1].ScheduleStart + gameTiming.extraInfo.blockBetDuration;

      const scheduleStart = index === 0 ? gameTiming.extraInfo.oddsDuration : timelines[index - 1].ResultAvailable;

      const resultAvailable = scheduleStart + currentVideoLength + gameTiming.extraInfo.afterGoalDuration;

      const timeline: Timeline = {
        OddsAvailable: oddsAvailable,
        ScheduleStart: scheduleStart,
        ResultAvailable: resultAvailable,
      };

      timelines.push(timeline);
    }

    return timelines;
  }

  generateTimelineForSecondHalf(videoLengths: number[], fhTimelines: Timeline[]): Timeline[] {
    const gameTiming = this.gameSettings.gameTiming as GameTiming;

    const timelines: Timeline[] = [];

    for (let index = 0; index < videoLengths.length; index++) {
      const currentVideoLength = videoLengths[index];

      const oddsAvailable =
        index === 0
          ? fhTimelines[fhTimelines.length - 1].ResultAvailable
          : timelines[index - 1].ScheduleStart + gameTiming.extraInfo.blockBetDuration;

      const scheduleStart =
        index === 0 ? oddsAvailable + gameTiming.extraInfo.halfTimeDuration : timelines[index - 1].ResultAvailable;

      const resultAvailable = scheduleStart + currentVideoLength + gameTiming.extraInfo.afterGoalDuration;

      const timeline: Timeline = {
        OddsAvailable: oddsAvailable,
        ScheduleStart: scheduleStart,
        ResultAvailable: resultAvailable,
      };

      timelines.push(timeline);
    }

    return timelines;
  }

  generateBlockFromRate(blockRate: Record<string, number>): number {
    const blocks = Object.keys(blockRate);
    const rates = Object.values(blockRate);

    return Number(secureWeightedPick(blocks, rates));
  }

  createNewMatchConfigAndGenerateResults(): { matchConfig: MatchConfig; result: EventDetailResult[] } {
    const gameTiming = this.gameSettings.gameTiming as GameTiming;
    const isHomeFavorite = secureRandomBool();
    const fhBlocks = this.generateBlockFromRate(this.rateConfigs.blockRate);
    const shBlocks = this.generateBlockFromRate(this.rateConfigs.blockRate);

    const fhRateConfigs = this.generateRateConfigsForPhase(isHomeFavorite, fhBlocks);
    const shRateConfigs = this.generateRateConfigsForPhase(isHomeFavorite, shBlocks);

    const { videoLengths: fhVideoLengths, results: fhResults } =
      this.resultGeneratorService.generateResultForUltraLivePhase(fhRateConfigs, 0);

    const { videoLengths: shVideoLengths, results: shResults } =
      this.resultGeneratorService.generateResultForUltraLivePhase(shRateConfigs, 1);

    const fhTimelines = this.generateTimelineForFirstHalf(fhVideoLengths);
    const shTimelines = this.generateTimelineForSecondHalf(shVideoLengths, fhTimelines);
    const wholeRound = shTimelines[shTimelines.length - 1].ResultAvailable + gameTiming.extraInfo.resultDuration;

    const fhEventDetailInfos = fhRateConfigs.map((config, index) => {
      const currentFhTotalScoreRates = oddsHelper.mergeArrayOfRates(fhRateConfigs.slice(index));

      return {
        rateConfig: config,
        phase: 0,
        oddsInfo: this.oddsGeneratorService.calculateOddsInfo(currentFhTotalScoreRates.scoreRate),
        videoLength: fhVideoLengths[index],
      };
    });

    const shEventDetailInfos = shRateConfigs.map((config, index) => {
      const currentShTotalScoreRates = oddsHelper.mergeArrayOfRates(shRateConfigs.slice(index));

      return {
        rateConfig: config,
        phase: 1,
        oddsInfo: this.oddsGeneratorService.calculateOddsInfo(currentShTotalScoreRates.scoreRate),
        videoLength: shVideoLengths[index],
      };
    });

    const ftOddsInfo = fhRateConfigs.map((_, index) => {
      const currentFtTotalScoreRates = oddsHelper.mergeArrayOfRates(fhRateConfigs.slice(index).concat(shRateConfigs));

      return this.oddsGeneratorService.calculateOddsInfo(currentFtTotalScoreRates.scoreRate);
    });

    return {
      matchConfig: {
        gameTiming: { ...this.gameSettings.gameTiming, timelines: [...fhTimelines, ...shTimelines], wholeRound },
        numberOfEventDetails: fhBlocks + shBlocks,
        eventDetailInfos: [...fhEventDetailInfos, ...shEventDetailInfos],
        rateConfig: oddsHelper.mergeArrayOfRates(fhRateConfigs.concat(shRateConfigs)),
        oddsInfo: ftOddsInfo,
      },
      result: [...fhResults, ...shResults],
    };
  }

  override generateNewRound(roundId: number) {
    const { homeTeam, awayTeam, theme } = this.createNewMatch(roundId);

    const { matchConfig, result } = this.createNewMatchConfigAndGenerateResults();

    const odds = this.oddsGeneratorService.calculateOddsForUltraLive(matchConfig, result);
    const selections = this.oddsGeneratorService.generateSelectionsForUltraLive(odds, matchConfig, result);
    const settlementResult = this.resultGeneratorService.generateSettlementResult(result, matchConfig);

    return {
      gameId: this.gameSettings.gameId,
      eventID: idHelper.createEventId(this.gameSettings.gameId, roundId),
      roundId,
      homeTeam,
      awayTeam,
      theme,
      matchConfig,
      odds,
      encryptedResult: encrypt(result),
      encryptedSettlementResult: encrypt(settlementResult),
      encryptedSelections: encrypt(selections),
      ended: false,
    } as GameRunningRound;
  }
}
