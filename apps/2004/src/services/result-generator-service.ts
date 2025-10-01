import {
  ResultGeneratorService as BaseResultGeneratorService,
  resultHelper,
  FirstHalfOddsKey,
  SecondHalfOddsKey,
} from "@soccer-marble/soccer-marble-base";
import type {
  RoundResult,
  MatchConfig,
  DataResultType,
  ResultType,
  EventDetailResult,
  DrawSettlementResult,
  RoundSettlementResult,
} from "@soccer-marble/soccer-marble-base";

import type { OddsInfo } from "../types";

export class ResultGeneratorService extends BaseResultGeneratorService {
  override getSettlementResult: (roundResult: RoundResult, matchConfig: MatchConfig) => RoundSettlementResult = (
    roundResult,
    matchConfig
  ) => {
    const firstHalfInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 0);
    const secondHalfInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 1);
    const fhResults = roundResult.filter((result) => result.phase === 0).map((result) => result.result);
    const shResults = roundResult.filter((result) => result.phase === 1).map((result) => result.result);
    const ftResult = resultHelper.combineResults(fhResults.concat(shResults));
    const ftSettlementResult = this.getFullTimeSettlementResult(ftResult, matchConfig.oddsInfo[0]);
    const wholeFhResult = resultHelper.combineResults(fhResults);
    const wholeFhSettlementResult = this.getWholeFirstHalfSettlementResult(wholeFhResult, firstHalfInfos[0].oddsInfo);

    const fhSettlementResults = firstHalfInfos.map((info, index) => {
      const liveFhResult = resultHelper.combineResults(fhResults.slice(index));
      const liveFtResult = resultHelper.combineResults(fhResults.slice(index).concat(shResults));
      const fhOddsInfo = info.oddsInfo;
      const ftOddsInfo = matchConfig.oddsInfo[index];
      const fhSettlementResult = this.getSettlementResultForEventDetailFirstHalf(
        liveFhResult,
        liveFtResult,
        fhOddsInfo,
        ftOddsInfo,
        ftSettlementResult,
        wholeFhSettlementResult
      );
      return fhSettlementResult;
    });

    const shSettlementResults = secondHalfInfos.map((info, index) => {
      const liveShResult = resultHelper.combineResults(shResults.slice(index));
      const shOddsInfo = info.oddsInfo;
      const shSettlementResult = this.getSettlementResultForEventDetailSecondHalf(
        liveShResult,
        shOddsInfo,
        ftSettlementResult
      );
      return shSettlementResult;
    });

    return [...fhSettlementResults, ...shSettlementResults];
  };

  override getSettlementResultFromResultString = (resultString: string, oddsInfo: any) => {
    const homeGoals = resultString.split("H").length - 1;
    const awayGoals = resultString.split("A").length - 1;
    const totalGoals = homeGoals + awayGoals;
    const hdpResult = resultHelper.getHandicapResult(homeGoals, awayGoals, oddsInfo.handicapValue);
    const o1x2Result = resultHelper.get1X2Result(homeGoals, awayGoals);
    const ouResult = resultHelper.getOverUnderResult(totalGoals, oddsInfo.overUnderValue);
    const oeResult = resultHelper.getOddEvenResult(totalGoals);

    return {
      handicapHome: hdpResult.hdpHome,
      handicapAway: hdpResult.hdpAway,
      home: o1x2Result.home,
      away: o1x2Result.away,
      draw: o1x2Result.draw,
      over: ouResult.over,
      under: ouResult.under,
      odd: oeResult.odd,
      even: oeResult.even,
    };
  };

  generateResult = (data: DataResultType): RoundResult => {
    const numberOfVideos = data.numberOfVideos;
    const firstHalfInfos = data.matchConfig.eventDetailInfos.filter((info) => info.phase === 0);
    const secondHalfInfos = data.matchConfig.eventDetailInfos.filter((info) => info.phase === 1);

    const firstHalfResults = firstHalfInfos.map((info) => {
      const eventDetailResult = this.generateResultFromRate(info.rateConfig);
      const videoName = this.generateVideoName(eventDetailResult.goalSequence, numberOfVideos);

      return {
        playlist: videoName,
        goalInfo: videoName,
        result: eventDetailResult,
        phase: 0,
      } as EventDetailResult;
    });

    const secondHalfResults = secondHalfInfos.map((info) => {
      const eventDetailResult = this.generateResultFromRate(info.rateConfig);
      const videoName = this.generateVideoName(eventDetailResult.goalSequence, numberOfVideos);

      return {
        playlist: videoName,
        goalInfo: videoName,
        result: eventDetailResult,
        phase: 1,
      } as EventDetailResult;
    });

    return [...firstHalfResults, ...secondHalfResults];
  };

  getFullTimeSettlementResult = (ftResult: ResultType, ftOddsInfo: OddsInfo): DrawSettlementResult => {
    return this.getSettlementResultFromResultString(ftResult.goalSequence, ftOddsInfo);
  };

  getWholeFirstHalfSettlementResult = (fhResult: ResultType, ftOddsInfo: OddsInfo): DrawSettlementResult => {
    return this.getSettlementResultFromResultString(fhResult.goalSequence, ftOddsInfo);
  };

  getSettlementResultForEventDetailFirstHalf = (
    liveFhResult: ResultType,
    liveFtResult: ResultType,
    fhOddsInfo: OddsInfo,
    ftOddsInfo: OddsInfo,
    ftSettlementResult: DrawSettlementResult,
    wholeFhSettlementResult: DrawSettlementResult
  ): DrawSettlementResult => {
    const liveFhSettlementResult = this.getSettlementResultFromResultString(liveFhResult.goalSequence, fhOddsInfo);

    const liveFtSettlementResult = this.getSettlementResultFromResultString(liveFtResult.goalSequence, ftOddsInfo);

    return {
      [FirstHalfOddsKey.FT_HDP_HOME]: liveFtSettlementResult.handicapHome,
      [FirstHalfOddsKey.FT_HDP_AWAY]: liveFtSettlementResult.handicapAway,
      [FirstHalfOddsKey.FT_1X2_HOME]: ftSettlementResult.home,
      [FirstHalfOddsKey.FT_1X2_AWAY]: ftSettlementResult.away,
      [FirstHalfOddsKey.FT_1X2_DRAW]: ftSettlementResult.draw,
      [FirstHalfOddsKey.FT_OU_OVER]: liveFtSettlementResult.over,
      [FirstHalfOddsKey.FT_OU_UNDER]: liveFtSettlementResult.under,
      [FirstHalfOddsKey.FT_OE_ODD]: ftSettlementResult.odd,
      [FirstHalfOddsKey.FT_OE_EVEN]: ftSettlementResult.even,

      [FirstHalfOddsKey.H1_HDP_HOME]: liveFhSettlementResult.handicapHome,
      [FirstHalfOddsKey.H1_HDP_AWAY]: liveFhSettlementResult.handicapAway,
      [FirstHalfOddsKey.H1_1X2_HOME]: wholeFhSettlementResult.home,
      [FirstHalfOddsKey.H1_1X2_AWAY]: wholeFhSettlementResult.away,
      [FirstHalfOddsKey.H1_1X2_DRAW]: wholeFhSettlementResult.draw,
      [FirstHalfOddsKey.H1_OU_OVER]: liveFhSettlementResult.over,
      [FirstHalfOddsKey.H1_OU_UNDER]: liveFhSettlementResult.under,
      [FirstHalfOddsKey.H1_OE_ODD]: wholeFhSettlementResult.odd,
      [FirstHalfOddsKey.H1_OE_EVEN]: wholeFhSettlementResult.even,
    };
  };

  getSettlementResultForEventDetailSecondHalf = (
    liveShResult: ResultType,
    shOddsInfo: OddsInfo,
    ftSettlementResult: DrawSettlementResult
  ): DrawSettlementResult => {
    const secondHalfSettlementResult = this.getSettlementResultFromResultString(liveShResult.goalSequence, shOddsInfo);

    return {
      [SecondHalfOddsKey.FT_1X2_HOME]: ftSettlementResult.home,
      [SecondHalfOddsKey.FT_1X2_AWAY]: ftSettlementResult.away,
      [SecondHalfOddsKey.FT_1X2_DRAW]: ftSettlementResult.draw,
      [SecondHalfOddsKey.FT_HDP_HOME]: secondHalfSettlementResult.handicapHome,
      [SecondHalfOddsKey.FT_HDP_AWAY]: secondHalfSettlementResult.handicapAway,
      [SecondHalfOddsKey.FT_OU_OVER]: secondHalfSettlementResult.over,
      [SecondHalfOddsKey.FT_OU_UNDER]: secondHalfSettlementResult.under,
      [SecondHalfOddsKey.FT_OE_ODD]: ftSettlementResult.odd,
      [SecondHalfOddsKey.FT_OE_EVEN]: ftSettlementResult.even,
    };
  };
}
