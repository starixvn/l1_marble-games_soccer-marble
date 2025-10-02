import { secureShuffle } from "sc-core-rng";
import {
  RoundResult,
  DataResultType,
  RoundSettlementResult,
  EventDetailResult,
  MatchConfig,
  FirstHalfOddsKey,
  FullTimeOddsKey,
  AppContainer,
  RateConfig,
  ResultType,
  DrawSettlementResult,
} from "../types";
import { oddsHelper, resultHelper } from "../helpers";

export class ResultGeneratorService {
  protected readonly gameSettings: any;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
  }

  generateResult = (data: DataResultType): RoundResult => {
    const numberOfVideos = data.numberOfVideos;
    const firstHalf = this.generateResultFromRate(data.matchConfig.eventDetailInfos[0].rateConfig);
    const secondHalf = this.generateResultFromRate(data.matchConfig.eventDetailInfos[1].rateConfig);
    const videoInfo = this.generateVideoInfoFromResult(firstHalf.goalSequence, secondHalf.goalSequence, numberOfVideos);

    const firstHalfResult: EventDetailResult = {
      playlist: videoInfo.firstHalfVideo,
      goalInfo: videoInfo.firstHalfVideo,
      result: firstHalf,
      phase: 0,
    };

    const secondHalfResult: EventDetailResult = {
      playlist: videoInfo.secondHalfVideo,
      goalInfo: videoInfo.secondHalfVideo,
      result: secondHalf,
      phase: 1,
    };

    return [firstHalfResult, secondHalfResult];
  };

  generateSettlementResult = (roundResult: RoundResult, matchConfig: MatchConfig): RoundSettlementResult => {
    const fullTimeSettlementResult = this.generateFullTimeSettlementResult(roundResult, matchConfig);

    const firstHalfSettlementResult = this.generateFirstHalfSettlementResult(
      roundResult,
      matchConfig,
      fullTimeSettlementResult
    );

    const secondHalfSettlementResult = this.generateSecondHalfSettlementResult(
      roundResult,
      matchConfig,
      fullTimeSettlementResult
    );

    return [firstHalfSettlementResult, secondHalfSettlementResult];
  };

  generateFullTimeSettlementResult = (roundResult: RoundResult, matchConfig: MatchConfig): DrawSettlementResult => {
    const firstHalf = roundResult[0].result;
    const secondHalf = roundResult[1].result;
    const fullTime = resultHelper.combineResults([firstHalf, secondHalf]);

    const fullTimeSettlementResult = this.generateSettlementResultFromResult(fullTime, matchConfig.oddsInfo);

    return {
      [FullTimeOddsKey.FT_HDP_HOME]: fullTimeSettlementResult.handicapHome,
      [FullTimeOddsKey.FT_HDP_AWAY]: fullTimeSettlementResult.handicapAway,

      [FullTimeOddsKey.FT_1X2_HOME]: fullTimeSettlementResult.home,
      [FullTimeOddsKey.FT_1X2_AWAY]: fullTimeSettlementResult.away,
      [FullTimeOddsKey.FT_1X2_DRAW]: fullTimeSettlementResult.draw,

      [FullTimeOddsKey.FT_OU_OVER]: fullTimeSettlementResult.over,
      [FullTimeOddsKey.FT_OU_UNDER]: fullTimeSettlementResult.under,

      [FullTimeOddsKey.FT_OE_ODD]: fullTimeSettlementResult.odd,
      [FullTimeOddsKey.FT_OE_EVEN]: fullTimeSettlementResult.even,

      [FullTimeOddsKey.FT_HOME_OVER]: fullTimeSettlementResult.homeOver,
      [FullTimeOddsKey.FT_HOME_UNDER]: fullTimeSettlementResult.homeUnder,
      [FullTimeOddsKey.FT_AWAY_OVER]: fullTimeSettlementResult.awayOver,
      [FullTimeOddsKey.FT_AWAY_UNDER]: fullTimeSettlementResult.awayUnder,
    };
  };

  generateFirstHalfSettlementResult = (
    roundResult: RoundResult,
    matchConfig: MatchConfig,
    fullTimeSettlementResult: DrawSettlementResult
  ): DrawSettlementResult => {
    const firstHalf = roundResult[0].result;
    const firstHalfSettlementResult = this.generateSettlementResultFromResult(
      firstHalf,
      matchConfig.eventDetailInfos[0].oddsInfo
    );

    return {
      ...fullTimeSettlementResult,

      [FirstHalfOddsKey.H1_HDP_HOME]: firstHalfSettlementResult.handicapHome,
      [FirstHalfOddsKey.H1_HDP_AWAY]: firstHalfSettlementResult.handicapAway,

      [FirstHalfOddsKey.H1_1X2_HOME]: firstHalfSettlementResult.home,
      [FirstHalfOddsKey.H1_1X2_AWAY]: firstHalfSettlementResult.away,
      [FirstHalfOddsKey.H1_1X2_DRAW]: firstHalfSettlementResult.draw,

      [FirstHalfOddsKey.H1_OU_OVER]: firstHalfSettlementResult.over,
      [FirstHalfOddsKey.H1_OU_UNDER]: firstHalfSettlementResult.under,

      [FirstHalfOddsKey.H1_OE_ODD]: firstHalfSettlementResult.odd,
      [FirstHalfOddsKey.H1_OE_EVEN]: firstHalfSettlementResult.even,

      [FirstHalfOddsKey.H1_HOME_OVER]: firstHalfSettlementResult.homeOver,
      [FirstHalfOddsKey.H1_HOME_UNDER]: firstHalfSettlementResult.homeUnder,
      [FirstHalfOddsKey.H1_AWAY_OVER]: firstHalfSettlementResult.awayOver,
      [FirstHalfOddsKey.H1_AWAY_UNDER]: firstHalfSettlementResult.awayUnder,
    };
  };

  generateSecondHalfSettlementResult = (
    roundResult: RoundResult,
    matchConfig: MatchConfig,
    fullTimeSettlementResult: DrawSettlementResult
  ): DrawSettlementResult => {
    const secondHalf = roundResult[1].result;

    const secondHalfSettlementResult = this.generateSettlementResultFromResult(
      secondHalf,
      matchConfig.eventDetailInfos[1].oddsInfo
    );

    return {
      ...fullTimeSettlementResult,

      [FullTimeOddsKey.FT_HDP_HOME]: secondHalfSettlementResult.handicapHome,
      [FullTimeOddsKey.FT_HDP_AWAY]: secondHalfSettlementResult.handicapAway,

      [FullTimeOddsKey.FT_OU_OVER]: secondHalfSettlementResult.over,
      [FullTimeOddsKey.FT_OU_UNDER]: secondHalfSettlementResult.under,

      [FullTimeOddsKey.FT_HOME_OVER]: secondHalfSettlementResult.homeOver,
      [FullTimeOddsKey.FT_HOME_UNDER]: secondHalfSettlementResult.homeUnder,
      [FullTimeOddsKey.FT_AWAY_OVER]: secondHalfSettlementResult.awayOver,
      [FullTimeOddsKey.FT_AWAY_UNDER]: secondHalfSettlementResult.awayUnder,
    };
  };

  generateSettlementResultFromResult = (result: ResultType, oddsInfo: any): DrawSettlementResult => {
    const [homeGoals, awayGoals] = oddsHelper.parseScore(result.finalScore);

    const totalGoals = homeGoals + awayGoals;
    const hdpResult = resultHelper.getHandicapResult(homeGoals, awayGoals, oddsInfo.handicapValue);
    const o1x2Result = resultHelper.get1X2Result(homeGoals, awayGoals);
    const ouResult = resultHelper.getOverUnderResult(totalGoals, oddsInfo.overUnderValue);
    const oeResult = resultHelper.getOddEvenResult(totalGoals);
    const teamOverUnderResult = resultHelper.getTeamOverUnderResult(
      homeGoals,
      awayGoals,
      oddsInfo.homeOverUnderValue,
      oddsInfo.awayOverUnderValue
    );

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
      homeOver: teamOverUnderResult.homeOver,
      awayOver: teamOverUnderResult.awayOver,
      homeUnder: teamOverUnderResult.homeUnder,
      awayUnder: teamOverUnderResult.awayUnder,
    };
  };

  generateResultFromRate = (rateConfig: RateConfig): ResultType => {
    const scoreResult = resultHelper.getScoreFromScoreRate(rateConfig.scoreRate);

    const [homeGoals, awayGoals] = scoreResult.split("-").map(Number);
    const sequence = Array(homeGoals).fill("H").concat(Array(awayGoals).fill("A"));

    const result = secureShuffle(sequence).join("");

    return {
      goalSequence: result || "0",
      finalScore: `${homeGoals}:${awayGoals}`,
    };
  };

  generateVideoInfoFromResult = (firstHalf: string, secondHalf: string, numberOfVideos: Record<string, number>) => {
    const firstHalfVideo = this.generateVideoName(firstHalf, numberOfVideos);
    const secondHalfVideo = this.generateVideoName(secondHalf, numberOfVideos, false, firstHalfVideo);

    return {
      firstHalfVideo,
      secondHalfVideo,
    };
  };

  generateVideoName = (
    result: string,
    numberOfVideos: Record<string, number>,
    videoDefault = false,
    ignoredVideo = ""
  ) => {
    const currentNumberOfVideos = numberOfVideos[result] || this.gameSettings.numberOfVideos[result];
    return resultHelper.generateVideoName(result, currentNumberOfVideos, videoDefault, ignoredVideo);
  };
}
