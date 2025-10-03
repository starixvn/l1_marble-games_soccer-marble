import {
  ResultGeneratorService as BaseResultGeneratorService,
  resultHelper,
  oddsHelper,
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
  override generateSettlementResult: (roundResult: RoundResult, matchConfig: MatchConfig) => RoundSettlementResult = (
    roundResult,
    matchConfig
  ) => {
    const fixedFtSettlementResult = this.generateFullTimeFixedSettlementResult(roundResult, matchConfig);

    const fhSettlementResults = this.generateFirstHalfSettlementResultForUltraLive(
      roundResult,
      matchConfig,
      fixedFtSettlementResult
    );

    const shSettlementResults = this.generateSecondHalfSettlementResultForUltraLive(
      roundResult,
      matchConfig,
      fixedFtSettlementResult
    );

    return [...fhSettlementResults, ...shSettlementResults];
  };

  override generateSettlementResultFromResult = (result: ResultType, oddsInfo: any) => {
    const [homeGoals, awayGoals] = oddsHelper.parseScore(result.finalScore);

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

  override generateResult = (data: DataResultType): RoundResult => {
    const numberOfVideos = data.numberOfVideos;
    const firstHalfInfos = data.matchConfig.eventDetailInfos.filter((info) => info.phase === 0);
    const secondHalfInfos = data.matchConfig.eventDetailInfos.filter((info) => info.phase === 1);

    const firstHalfResults = firstHalfInfos.map((info, index) => {
      const isLastBlock = index === firstHalfInfos.length - 1;

      const eventDetailResult = this.generateResultFromRate(info.rateConfig);

      const videoName = this.generateVideoNameForUltraLive(
        eventDetailResult.goalSequence,
        numberOfVideos,
        isLastBlock,
        info.videoLength as number
      );

      return {
        playlist: videoName,
        goalInfo: videoName,
        result: eventDetailResult,
        phase: 0,
      } as EventDetailResult;
    });

    const secondHalfResults = secondHalfInfos.map((info, index) => {
      const isLastBlock = index === secondHalfInfos.length - 1;

      const eventDetailResult = this.generateResultFromRate(info.rateConfig);
      const videoName = this.generateVideoNameForUltraLive(
        eventDetailResult.goalSequence,
        numberOfVideos,
        isLastBlock,
        info.videoLength as number
      );

      return {
        playlist: videoName,
        goalInfo: videoName,
        result: eventDetailResult,
        phase: 1,
      } as EventDetailResult;
    });

    return [...firstHalfResults, ...secondHalfResults];
  };

  generateVideoNameForUltraLive = (
    goalSequence: string,
    numberOfVideos: Record<string, number>,
    isLastBlock: boolean,
    videoLength: number
  ) => {
    const videoLengthStr = videoLength.toString().padStart(2, "0");
    const videoType = isLastBlock ? "1" : "0";
    const video = `${goalSequence}${videoLengthStr}${videoType}`;

    return this.generateVideoName(video, numberOfVideos);
  };

  generateFirstHalfSettlementResultForUltraLive = (
    roundResult: RoundResult,
    matchConfig: MatchConfig,
    fixedFtSettlementResult: DrawSettlementResult
  ): DrawSettlementResult[] => {
    const firstHalfInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 0);

    const fhResults = roundResult.filter((result) => result.phase === 0).map((result) => result.result);
    const shResults = roundResult.filter((result) => result.phase === 1).map((result) => result.result);

    const fixedFhSettlementResult = this.generateFirstHalfFixedSettlementResult(roundResult, matchConfig);

    return firstHalfInfos.map((info, index) => {
      const liveFhResult = resultHelper.combineResults(fhResults.slice(index));
      const liveFtResult = resultHelper.combineResults(fhResults.slice(index).concat(shResults));
      const fhOddsInfo = info.oddsInfo;
      const ftOddsInfo = matchConfig.oddsInfo[index];

      const liveFhSettlementResult = this.generateFirstHalfLiveSettlementResult(liveFhResult, fhOddsInfo);

      const liveFtSettlementResult = this.generateFullTimeLiveSettlementResult(liveFtResult, ftOddsInfo);

      return {
        ...fixedFtSettlementResult,
        ...liveFtSettlementResult,
        ...fixedFhSettlementResult,
        ...liveFhSettlementResult,
      };
    });
  };

  generateSecondHalfSettlementResultForUltraLive = (
    roundResult: RoundResult,
    matchConfig: MatchConfig,
    fixedFtSettlementResult: DrawSettlementResult
  ): DrawSettlementResult[] => {
    const secondHalfInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 1);

    const shResults = roundResult.filter((result) => result.phase === 1).map((result) => result.result);

    return secondHalfInfos.map((info, index) => {
      const liveShResult = resultHelper.combineResults(shResults.slice(index));
      const shOddsInfo = info.oddsInfo;
      const liveShSettlementResult = this.generateFullTimeLiveSettlementResult(liveShResult, shOddsInfo);

      return {
        ...fixedFtSettlementResult,
        ...liveShSettlementResult,
      };
    });
  };

  generateFullTimeFixedSettlementResult = (
    roundResult: RoundResult,
    matchConfig: MatchConfig
  ): DrawSettlementResult => {
    const fhResults = roundResult.filter((result) => result.phase === 0).map((result) => result.result);
    const shResults = roundResult.filter((result) => result.phase === 1).map((result) => result.result);
    const ftResult = resultHelper.combineResults(fhResults.concat(shResults));

    const ftOddsInfo = matchConfig.oddsInfo[0];

    const ftSettlementResult = this.generateSettlementResultFromResult(ftResult, ftOddsInfo);

    return {
      [FullTimeOddsKey.FT_1X2_HOME]: ftSettlementResult.home,
      [FullTimeOddsKey.FT_1X2_AWAY]: ftSettlementResult.away,
      [FullTimeOddsKey.FT_1X2_DRAW]: ftSettlementResult.draw,
      [FullTimeOddsKey.FT_OE_ODD]: ftSettlementResult.odd,
      [FullTimeOddsKey.FT_OE_EVEN]: ftSettlementResult.even,
    };
  };

  generateFirstHalfFixedSettlementResult = (
    roundResult: RoundResult,
    matchConfig: MatchConfig
  ): DrawSettlementResult => {
    const firstHalfInfos = matchConfig.eventDetailInfos.filter((info) => info.phase === 0);
    const fhResults = roundResult.filter((result) => result.phase === 0).map((result) => result.result);
    const fhResult = resultHelper.combineResults(fhResults);
    const fhOddsInfo = firstHalfInfos[0].oddsInfo;

    const fhSettlementResult = this.generateSettlementResultFromResult(fhResult, fhOddsInfo);

    return {
      [FirstHalfOddsKey.H1_1X2_HOME]: fhSettlementResult.home,
      [FirstHalfOddsKey.H1_1X2_AWAY]: fhSettlementResult.away,
      [FirstHalfOddsKey.H1_1X2_DRAW]: fhSettlementResult.draw,
      [FirstHalfOddsKey.H1_OE_ODD]: fhSettlementResult.odd,
      [FirstHalfOddsKey.H1_OE_EVEN]: fhSettlementResult.even,
    };
  };

  generateFirstHalfLiveSettlementResult = (liveFhResult: ResultType, fhOddsInfo: OddsInfo): DrawSettlementResult => {
    const liveFhSettlementResult = this.generateSettlementResultFromResult(liveFhResult, fhOddsInfo);

    return {
      [FirstHalfOddsKey.H1_HDP_HOME]: liveFhSettlementResult.handicapHome,
      [FirstHalfOddsKey.H1_HDP_AWAY]: liveFhSettlementResult.handicapAway,
      [FirstHalfOddsKey.H1_OU_OVER]: liveFhSettlementResult.over,
      [FirstHalfOddsKey.H1_OU_UNDER]: liveFhSettlementResult.under,
    };
  };

  generateFullTimeLiveSettlementResult = (liveShResult: ResultType, liveFtOddsInfo: OddsInfo): DrawSettlementResult => {
    const liveFtSettlementResult = this.generateSettlementResultFromResult(liveShResult, liveFtOddsInfo);

    return {
      [FullTimeOddsKey.FT_HDP_HOME]: liveFtSettlementResult.handicapHome,
      [FullTimeOddsKey.FT_HDP_AWAY]: liveFtSettlementResult.handicapAway,
      [FullTimeOddsKey.FT_OU_OVER]: liveFtSettlementResult.over,
      [FullTimeOddsKey.FT_OU_UNDER]: liveFtSettlementResult.under,
    };
  };
}
