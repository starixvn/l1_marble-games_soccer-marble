import { secureShuffle } from "sc-core-rng";
import {
  RoundResult,
  DataResultType,
  RoundSettlementResult,
  EventDetailResult,
  MatchConfig,
  FirstHalfOddsKey,
  SecondHalfOddsKey,
  AppContainer,
  RateConfig,
  ResultType,
  DrawSettlementResult,
} from "../types";
import { resultHelper } from "../helpers";

export class ResultGeneratorService {
  protected readonly gameSettings: any;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
  }

  generateResult = (data: DataResultType): RoundResult => {
    const numberOfVideos = data.numberOfVideos;
    const firstHalf = this.generateResultFromRate(data.matchConfig.eventDetailInfos[0].rateConfig);
    const secondHalf = this.generateResultFromRate(data.matchConfig.eventDetailInfos[1].rateConfig);
    const videoInfo = this.getVideoInfoFromResult(firstHalf.goalSequence, secondHalf.goalSequence, numberOfVideos);

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

  getSettlementResult = (roundResult: RoundResult, matchConfig: MatchConfig): RoundSettlementResult => {
    const firstHalf = roundResult[0].result;
    const secondHalf = roundResult[1].result;

    const firstHalfSettlementResult = this.getSettlementResultFromResultString(
      firstHalf.goalSequence,
      matchConfig.eventDetailInfos[0].oddsInfo
    );
    const secondHalfSettlementResult = this.getSettlementResultFromResultString(
      secondHalf.goalSequence,
      matchConfig.eventDetailInfos[1].oddsInfo
    );
    const fullTimeSettlementResult = this.getSettlementResultFromResultString(
      firstHalf.goalSequence + secondHalf.goalSequence,
      matchConfig.oddsInfo
    );

    const finalFirstHalfSettlementResult = {
      [FirstHalfOddsKey.FT_HDP_HOME]: fullTimeSettlementResult.handicapHome,
      [FirstHalfOddsKey.FT_HDP_AWAY]: fullTimeSettlementResult.handicapAway,
      [FirstHalfOddsKey.FT_1X2_HOME]: fullTimeSettlementResult.home,
      [FirstHalfOddsKey.FT_1X2_AWAY]: fullTimeSettlementResult.away,
      [FirstHalfOddsKey.FT_1X2_DRAW]: fullTimeSettlementResult.draw,
      [FirstHalfOddsKey.FT_OU_OVER]: fullTimeSettlementResult.over,
      [FirstHalfOddsKey.FT_OU_UNDER]: fullTimeSettlementResult.under,
      [FirstHalfOddsKey.FT_OE_ODD]: fullTimeSettlementResult.odd,
      [FirstHalfOddsKey.FT_OE_EVEN]: fullTimeSettlementResult.even,

      [FirstHalfOddsKey.FT_HOME_OVER]: fullTimeSettlementResult.homeOver,
      [FirstHalfOddsKey.FT_HOME_UNDER]: fullTimeSettlementResult.homeUnder,
      [FirstHalfOddsKey.FT_AWAY_OVER]: fullTimeSettlementResult.awayOver,
      [FirstHalfOddsKey.FT_AWAY_UNDER]: fullTimeSettlementResult.awayUnder,

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

    const finalSecondHalfSettlementResult = {
      [SecondHalfOddsKey.FT_1X2_HOME]: fullTimeSettlementResult.home,
      [SecondHalfOddsKey.FT_1X2_AWAY]: fullTimeSettlementResult.away,
      [SecondHalfOddsKey.FT_1X2_DRAW]: fullTimeSettlementResult.draw,
      [SecondHalfOddsKey.FT_HDP_HOME]: secondHalfSettlementResult.handicapHome,
      [SecondHalfOddsKey.FT_HDP_AWAY]: secondHalfSettlementResult.handicapAway,
      [SecondHalfOddsKey.FT_OU_OVER]: secondHalfSettlementResult.over,
      [SecondHalfOddsKey.FT_OU_UNDER]: secondHalfSettlementResult.under,
      [SecondHalfOddsKey.FT_OE_ODD]: fullTimeSettlementResult.odd,
      [SecondHalfOddsKey.FT_OE_EVEN]: fullTimeSettlementResult.even,

      [SecondHalfOddsKey.FT_HOME_OVER]: secondHalfSettlementResult.homeOver,
      [SecondHalfOddsKey.FT_HOME_UNDER]: secondHalfSettlementResult.homeUnder,
      [SecondHalfOddsKey.FT_AWAY_OVER]: secondHalfSettlementResult.awayOver,
      [SecondHalfOddsKey.FT_AWAY_UNDER]: secondHalfSettlementResult.awayUnder,
    };

    return [finalFirstHalfSettlementResult, finalSecondHalfSettlementResult];
  };

  getSettlementResultFromResultString = (resultString: string, oddsInfo: any): DrawSettlementResult => {
    const homeGoals = resultString.split("H").length - 1;
    const awayGoals = resultString.split("A").length - 1;
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

  getVideoInfoFromResult = (firstHalf: string, secondHalf: string, numberOfVideos: Record<string, number>) => {
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
