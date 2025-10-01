import {
  OddsGeneratorService as BaseOddsGeneratorService,
  oddsHelper,
  resultHelper,
  SecondHalfOddsKey,
  FirstHalfOddsKey,
  SettlementStatus,
} from "@soccer-marble/soccer-marble-base";
import type { RoundResult, Selection, MatchConfig, RateConfig } from "@soccer-marble/soccer-marble-base";
import type { OddsInfo } from "../types";
export class OddsGeneratorService extends BaseOddsGeneratorService {
  override calculateOddsInfo = (scoreRates: Record<string, number>) => {
    const { homeScore, awayScore } = oddsHelper.calculateAverageScore(scoreRates);
    const handicapValue = this.calculateHandicapValue(homeScore, awayScore);
    const overUnderValue = this.calculateOverUnderValue(homeScore, awayScore);

    return {
      handicapValue,
      overUnderValue,
    };
  };

  calculateOddsForUltraLive = (matchConfig: MatchConfig, result: RoundResult): Record<string, number>[] => {
    const allFirstHalfOdds = this.calculateOddsForFirstHalfUltraLive(matchConfig, result);
    const allSecondHalfOdds = this.calculateOddsForSecondHalfUltraLive(matchConfig, result);

    return [...allFirstHalfOdds, ...allSecondHalfOdds];
  };

  generateSelectionsForUltraLive = (odds: Record<string, number>[], matchConfig: MatchConfig, result: RoundResult) => {
    const fhEventDetailInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 0);
    const allFirstHalfOdds = odds.slice(0, fhEventDetailInfos.length);
    const allSecondHalfOdds = odds.slice(fhEventDetailInfos.length);

    const firstHalfSelections = this.generateFirstHalfSelectionsForUltraLive(allFirstHalfOdds, result, matchConfig);
    const secondHalfSelections = this.generateSecondHalfSelectionsForUltraLive(allSecondHalfOdds, result, matchConfig);

    return [...firstHalfSelections, ...secondHalfSelections];
  };

  calculateOddsForFirstHalfUltraLive = (matchConfig: MatchConfig, result: RoundResult) => {
    const fhEventDetailInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 0);
    const shEventDetailInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 1);
    const shScoreRates = shEventDetailInfos.map((info) => info.rateConfig);
    const fhResults = result.filter((result) => result.phase === 0).map((result) => result.result);

    const allFirstHalfOdds = fhEventDetailInfos.map((_, index) => {
      const fhScoreRates = fhEventDetailInfos.map((info) => info.rateConfig).slice(index);
      const totalFhScoreRates = oddsHelper.mergeArrayOfRates(fhScoreRates);
      const totalFtScoreRates = oddsHelper.mergeArrayOfRates(fhScoreRates.concat(shScoreRates));
      const liveResult = resultHelper.combineResults(fhResults.slice(0, index));
      const fhOdds = this.calculateOddsForEventDetailFirstHalf(
        liveResult.finalScore,
        totalFhScoreRates,
        totalFtScoreRates
      );
      return fhOdds;
    });

    return allFirstHalfOdds;
  };

  calculateOddsForEventDetailFirstHalf = (
    addingScore: string,
    currentFirstHalfScoreRates: RateConfig,
    currentFulltimeScoreRates: RateConfig
  ) => {
    const fulltime = this.calculateOddsFromRate(currentFulltimeScoreRates, addingScore);
    const firstHalf = this.calculateOddsFromRate(currentFirstHalfScoreRates, addingScore);

    const firstHalfOdds = {
      [FirstHalfOddsKey.H1_HDP_HOME]: firstHalf.hdpHome,
      [FirstHalfOddsKey.H1_HDP_AWAY]: firstHalf.hdpAway,
      [FirstHalfOddsKey.H1_1X2_HOME]: firstHalf.home,
      [FirstHalfOddsKey.H1_1X2_AWAY]: firstHalf.away,
      [FirstHalfOddsKey.H1_1X2_DRAW]: firstHalf.draw,
      [FirstHalfOddsKey.H1_OU_OVER]: firstHalf.over,
      [FirstHalfOddsKey.H1_OU_UNDER]: firstHalf.under,
      [FirstHalfOddsKey.H1_OE_ODD]: firstHalf.odd,
      [FirstHalfOddsKey.H1_OE_EVEN]: firstHalf.even,

      [FirstHalfOddsKey.FT_HDP_HOME]: fulltime.hdpHome,
      [FirstHalfOddsKey.FT_HDP_AWAY]: fulltime.hdpAway,
      [FirstHalfOddsKey.FT_1X2_HOME]: fulltime.home,
      [FirstHalfOddsKey.FT_1X2_AWAY]: fulltime.away,
      [FirstHalfOddsKey.FT_1X2_DRAW]: fulltime.draw,
      [FirstHalfOddsKey.FT_OU_OVER]: fulltime.over,
      [FirstHalfOddsKey.FT_OU_UNDER]: fulltime.under,
      [FirstHalfOddsKey.FT_OE_ODD]: fulltime.odd,
      [FirstHalfOddsKey.FT_OE_EVEN]: fulltime.even,
    };

    return firstHalfOdds;
  };

  generateFirstHalfSelectionsForUltraLive = (
    allFirstHalfOdds: Record<string, number>[],
    result: RoundResult,
    matchConfig: MatchConfig
  ) => {
    const firstHalfInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 0);
    const fhResults = result.filter((result) => result.phase === 0).map((result) => result.result);

    const firstHalfSelections = allFirstHalfOdds.map((firstHalfOdds, index) => {
      const currentFirstHalfOddsInfo = firstHalfInfos[index].oddsInfo;
      const currentFulltimeOddsInfo = matchConfig.oddsInfo[index];

      const liveResult = resultHelper.combineResults(fhResults.slice(0, index));

      const fhSelections = this.generateFirstHalfSelectionsForEventDetailFirstHalf(
        firstHalfOdds,
        liveResult.finalScore,
        currentFirstHalfOddsInfo,
        currentFulltimeOddsInfo
      );
      return fhSelections;
    });

    return firstHalfSelections;
  };

  generateFirstHalfSelectionsForEventDetailFirstHalf = (
    firstHalfOdds: Record<string, number>,
    addingScore: string,
    firstHalfOddsInfo: OddsInfo,
    fulltimeOddsInfo: OddsInfo
  ) => {
    const firstHalfSelections: Record<string, Selection> = {};

    const [addingHomeGoals, addingAwayGoals] = oddsHelper.parseScore(addingScore);
    const addingTotalGoals = addingHomeGoals + addingAwayGoals;

    Object.entries(firstHalfOdds).forEach(([key, value]) => {
      const selection: Selection = {
        name: key,
        price: value,
        point: 0,
        settlementStatus: SettlementStatus.PLAY,
      };

      firstHalfSelections[key] = selection;
    });

    firstHalfSelections[FirstHalfOddsKey.FT_HDP_HOME].point = fulltimeOddsInfo.handicapValue;
    firstHalfSelections[FirstHalfOddsKey.FT_HDP_AWAY].point = -fulltimeOddsInfo.handicapValue;

    firstHalfSelections[FirstHalfOddsKey.H1_HDP_HOME].point = firstHalfOddsInfo.handicapValue;
    firstHalfSelections[FirstHalfOddsKey.H1_HDP_AWAY].point = -firstHalfOddsInfo.handicapValue;

    firstHalfSelections[FirstHalfOddsKey.FT_OU_OVER].point = fulltimeOddsInfo.overUnderValue + addingTotalGoals;
    firstHalfSelections[FirstHalfOddsKey.FT_OU_UNDER].point = fulltimeOddsInfo.overUnderValue + addingTotalGoals;

    firstHalfSelections[FirstHalfOddsKey.H1_OU_OVER].point = firstHalfOddsInfo.overUnderValue + addingTotalGoals;
    firstHalfSelections[FirstHalfOddsKey.H1_OU_UNDER].point = firstHalfOddsInfo.overUnderValue + addingTotalGoals;

    return firstHalfSelections;
  };

  calculateOddsForSecondHalfUltraLive = (matchConfig: MatchConfig, result: RoundResult) => {
    const shEventDetailInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 1);
    const fhResults = result.filter((result) => result.phase === 0).map((result) => result.result);
    const shResults = result.filter((result) => result.phase === 1).map((result) => result.result);

    const allSecondHalfOdds = shEventDetailInfos.map((_, index) => {
      const shScoreRates = shEventDetailInfos.map((info) => info.rateConfig).slice(index);
      const totalFhScoreRates = oddsHelper.mergeArrayOfRates(shScoreRates);
      const liveResult = resultHelper.combineResults(shResults.slice(0, index).concat(fhResults));
      const fhOdds = this.calculateOddsForEventDetailSecondHalf(liveResult.finalScore, totalFhScoreRates);
      return fhOdds;
    });

    return allSecondHalfOdds;
  };

  calculateOddsForEventDetailSecondHalf = (addingScore: string, currentSecondHalfScoreRates: RateConfig) => {
    const secondHalf = this.calculateOddsFromRate(currentSecondHalfScoreRates, addingScore);

    const secondHalfOdds = {
      [SecondHalfOddsKey.FT_HDP_HOME]: secondHalf.hdpHome,
      [SecondHalfOddsKey.FT_HDP_AWAY]: secondHalf.hdpAway,
      [SecondHalfOddsKey.FT_1X2_HOME]: secondHalf.home,
      [SecondHalfOddsKey.FT_1X2_AWAY]: secondHalf.away,
      [SecondHalfOddsKey.FT_1X2_DRAW]: secondHalf.draw,
      [SecondHalfOddsKey.FT_OU_OVER]: secondHalf.over,
      [SecondHalfOddsKey.FT_OU_UNDER]: secondHalf.under,
      [SecondHalfOddsKey.FT_OE_ODD]: secondHalf.odd,
      [SecondHalfOddsKey.FT_OE_EVEN]: secondHalf.even,
    };

    return secondHalfOdds;
  };

  generateSecondHalfSelectionsForUltraLive = (
    allSecondHalfOdds: Record<string, number>[],
    result: RoundResult,
    matchConfig: MatchConfig
  ) => {
    const secondHalfInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 1);
    const fhResults = result.filter((result) => result.phase === 0).map((result) => result.result);
    const shResults = result.filter((result) => result.phase === 1).map((result) => result.result);

    const secondHalfSelections = allSecondHalfOdds.map((secondHalfOdds, index) => {
      const currentSecondHalfOddsInfo = secondHalfInfos[index].oddsInfo;
      const liveResult = resultHelper.combineResults(shResults.slice(0, index).concat(fhResults));

      const shSelections = this.generateSecondHalfSelectionsForEventDetailSecondHalf(
        secondHalfOdds,
        liveResult.finalScore,
        currentSecondHalfOddsInfo
      );

      return shSelections;
    });

    return secondHalfSelections;
  };

  generateSecondHalfSelectionsForEventDetailSecondHalf = (
    secondHalfOdds: Record<string, number>,
    addingScore: string,
    secondHalfOddsInfo: OddsInfo
  ) => {
    const secondHalfSelections: Record<string, Selection> = {};
    const [addingHomeGoals, addingAwayGoals] = oddsHelper.parseScore(addingScore);
    const addingTotalGoals = addingHomeGoals + addingAwayGoals;

    Object.entries(secondHalfOdds).forEach(([key, value]) => {
      const selection: Selection = {
        name: key,
        price: value,
        point: 0,
        settlementStatus: SettlementStatus.PLAY,
      };

      secondHalfSelections[key] = selection;
    });

    secondHalfSelections[SecondHalfOddsKey.FT_HDP_HOME].point = secondHalfOddsInfo.handicapValue;
    secondHalfSelections[SecondHalfOddsKey.FT_HDP_AWAY].point = -secondHalfOddsInfo.handicapValue;

    secondHalfSelections[SecondHalfOddsKey.FT_OU_OVER].point = secondHalfOddsInfo.overUnderValue + addingTotalGoals;
    secondHalfSelections[SecondHalfOddsKey.FT_OU_UNDER].point = secondHalfOddsInfo.overUnderValue + addingTotalGoals;

    return secondHalfSelections;
  };
}
