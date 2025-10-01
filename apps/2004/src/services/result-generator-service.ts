import {
  ResultGeneratorService as BaseResultGeneratorService,
  resultHelper,
  FirstHalfOddsKey,
  FullTimeOddsKey,
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

    const fixedFtSettlementResult = this.generateFullTimeFixedSettlementResult(ftResult, matchConfig.oddsInfo[0]);

    const fixedFhResult = resultHelper.combineResults(fhResults);

    const fixedFhSettlementResult = this.generateFirstHalfFixedSettlementResult(
      fixedFhResult,
      firstHalfInfos[0].oddsInfo
    );

    const fhSettlementResults = firstHalfInfos.map((info, index) => {
      const liveFhResult = resultHelper.combineResults(fhResults.slice(index));
      const liveFtResult = resultHelper.combineResults(fhResults.slice(index).concat(shResults));
      const fhOddsInfo = info.oddsInfo;
      const ftOddsInfo = matchConfig.oddsInfo[index];

      const liveFhSettlementResult = this.generateLiveSettlementResultForFirstHalf(liveFhResult, fhOddsInfo);

      const liveFtSettlementResult = this.generateLiveSettlementResultForFulltime(liveFtResult, ftOddsInfo);

      return {
        ...fixedFtSettlementResult,
        ...liveFtSettlementResult,
        ...fixedFhSettlementResult,
        ...liveFhSettlementResult,
      };
    });

    const shSettlementResults = secondHalfInfos.map((info, index) => {
      const liveShResult = resultHelper.combineResults(shResults.slice(index));
      const shOddsInfo = info.oddsInfo;
      const liveShSettlementResult = this.generateLiveSettlementResultForFulltime(liveShResult, shOddsInfo);

      return {
        ...fixedFtSettlementResult,
        ...liveShSettlementResult,
      };
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

  generateFullTimeFixedSettlementResult = (ftResult: ResultType, ftOddsInfo: OddsInfo): DrawSettlementResult => {
    const ftSettlementResult = this.getSettlementResultFromResultString(ftResult.goalSequence, ftOddsInfo);

    return {
      [FullTimeOddsKey.FT_1X2_HOME]: ftSettlementResult.home,
      [FullTimeOddsKey.FT_1X2_AWAY]: ftSettlementResult.away,
      [FullTimeOddsKey.FT_1X2_DRAW]: ftSettlementResult.draw,
      [FullTimeOddsKey.FT_OE_ODD]: ftSettlementResult.odd,
      [FullTimeOddsKey.FT_OE_EVEN]: ftSettlementResult.even,
    };
  };

  generateFirstHalfFixedSettlementResult = (fhResult: ResultType, fhOddsInfo: OddsInfo): DrawSettlementResult => {
    const fhSettlementResult = this.getSettlementResultFromResultString(fhResult.goalSequence, fhOddsInfo);

    return {
      [FirstHalfOddsKey.H1_1X2_HOME]: fhSettlementResult.home,
      [FirstHalfOddsKey.H1_1X2_AWAY]: fhSettlementResult.away,
      [FirstHalfOddsKey.H1_1X2_DRAW]: fhSettlementResult.draw,
      [FirstHalfOddsKey.H1_OE_ODD]: fhSettlementResult.odd,
      [FirstHalfOddsKey.H1_OE_EVEN]: fhSettlementResult.even,
    };
  };

  generateLiveSettlementResultForFirstHalf = (liveFhResult: ResultType, fhOddsInfo: OddsInfo): DrawSettlementResult => {
    const liveFhSettlementResult = this.getSettlementResultFromResultString(liveFhResult.goalSequence, fhOddsInfo);

    return {
      [FirstHalfOddsKey.H1_HDP_HOME]: liveFhSettlementResult.handicapHome,
      [FirstHalfOddsKey.H1_HDP_AWAY]: liveFhSettlementResult.handicapAway,
      [FirstHalfOddsKey.H1_OU_OVER]: liveFhSettlementResult.over,
      [FirstHalfOddsKey.H1_OU_UNDER]: liveFhSettlementResult.under,
    };
  };

  generateLiveSettlementResultForFulltime = (
    liveShResult: ResultType,
    liveFtOddsInfo: OddsInfo
  ): DrawSettlementResult => {
    const liveFtSettlementResult = this.getSettlementResultFromResultString(liveShResult.goalSequence, liveFtOddsInfo);

    return {
      [FullTimeOddsKey.FT_HDP_HOME]: liveFtSettlementResult.handicapHome,
      [FullTimeOddsKey.FT_HDP_AWAY]: liveFtSettlementResult.handicapAway,
      [FullTimeOddsKey.FT_OU_OVER]: liveFtSettlementResult.over,
      [FullTimeOddsKey.FT_OU_UNDER]: liveFtSettlementResult.under,
    };
  };
}
