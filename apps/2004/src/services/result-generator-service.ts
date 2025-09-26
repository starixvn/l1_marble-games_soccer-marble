import {
  ResultGeneratorService as BaseResultGeneratorService,
  resultHelper,
  FirstHalfOddsKey,
  SecondHalfOddsKey,
  SettlementStatus,
} from "@soccer-marble/soccer-marble-base";
import type {
  DataResultType,
  DrawResultType,
  SettleConfig,
  MatchConfigType,
  ResultType,
  DrawSettlementResultType,
  RoundSettlementResultType,
} from "@soccer-marble/soccer-marble-base";
import type { HalfConfigType, MatchConfigsDetailType, RoundResultType } from "../types";

export class ResultGeneratorService extends BaseResultGeneratorService {
  generateResult = (data: DataResultType): RoundResultType => {
    const numberOfVideos = data.numberOfVideos;
    const firstHalfConfig = data.matchConfig.firstHalf;
    const secondHalfConfig = data.matchConfig.secondHalf;
    const firstHalfResults: DrawResultType[] = [];
    const secondHalfResults: DrawResultType[] = [];

    for (let i = 0; i < (firstHalfConfig as HalfConfigType).numberOfEventDetails; i++) {
      const eventDetailResult = this.generateResultFromRate(
        (firstHalfConfig as HalfConfigType).eventDetailScoreRates[i]
      );
      const videoName = this.generateVideoName(eventDetailResult.goalSequence, numberOfVideos);
      firstHalfResults.push({
        playlist: videoName,
        goalInfo: videoName,
        result: eventDetailResult,
      });
    }

    for (let i = 0; i < (secondHalfConfig as HalfConfigType).numberOfEventDetails; i++) {
      const eventDetailResult = this.generateResultFromRate(
        (secondHalfConfig as HalfConfigType).eventDetailScoreRates[i]
      );
      const videoName = this.generateVideoName(eventDetailResult.goalSequence, numberOfVideos);
      secondHalfResults.push({
        playlist: videoName,
        goalInfo: videoName,
        result: eventDetailResult,
      });
    }

    return {
      drawResults: [...firstHalfResults, ...secondHalfResults],
      firstHalfResults,
      secondHalfResults,
    } as any;
  };

  getSettlementResultForFirstHalf = (
    roundResult: RoundResultType,
    matchConfig: MatchConfigType,
    liveScore: ResultType
  ): DrawSettlementResultType => {
    const firstHalfResult = resultHelper.combineResults(roundResult.firstHalfResults.map((result) => result.result));
    const secondHalfResult = resultHelper.combineResults(roundResult.secondHalfResults.map((result) => result.result));

    const firstHalfSettlementResult = this.getSettlementResultFromResultStringWithLiveScore(
      firstHalfResult.goalSequence,
      liveScore.goalSequence,
      {
        overUnderValue: matchConfig.firstHalf.overUnderValue,
        handicapValue: matchConfig.firstHalf.handicapValue,
        homeOverUnderValue: matchConfig.firstHalf.homeOverUnderValue,
        awayOverUnderValue: matchConfig.firstHalf.awayOverUnderValue,
      }
    );

    const fullTimeSettlementResult = this.getSettlementResultFromResultStringWithLiveScore(
      firstHalfResult.goalSequence + secondHalfResult.goalSequence,
      liveScore.goalSequence,
      {
        overUnderValue: matchConfig.overUnderValue,
        handicapValue: matchConfig.handicapValue,
        homeOverUnderValue: matchConfig.homeOverUnderValue,
        awayOverUnderValue: matchConfig.awayOverUnderValue,
      }
    );

    return {
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
  };

  getSettlementResultForSecondHalf = (
    roundResult: RoundResultType,
    matchConfig: MatchConfigType,
    finalFirstHalfSettlementResult: DrawSettlementResultType,
    liveScore: ResultType
  ): DrawSettlementResultType => {
    const secondHalfResult = resultHelper.combineResults(roundResult.secondHalfResults.map((result) => result.result));

    const secondHalfSettlementResult = this.getSettlementResultFromResultStringWithLiveScore(
      secondHalfResult.goalSequence,
      liveScore.goalSequence,
      {
        overUnderValue: matchConfig.secondHalf.overUnderValue,
        handicapValue: matchConfig.secondHalf.handicapValue,
        homeOverUnderValue: matchConfig.secondHalf.homeOverUnderValue,
        awayOverUnderValue: matchConfig.secondHalf.awayOverUnderValue,
      }
    );

    return {
      [SecondHalfOddsKey.FT_1X2_HOME]: finalFirstHalfSettlementResult[FirstHalfOddsKey.FT_1X2_HOME],
      [SecondHalfOddsKey.FT_1X2_AWAY]: finalFirstHalfSettlementResult[FirstHalfOddsKey.FT_1X2_AWAY],
      [SecondHalfOddsKey.FT_1X2_DRAW]: finalFirstHalfSettlementResult[FirstHalfOddsKey.FT_1X2_DRAW],
      [SecondHalfOddsKey.FT_HDP_HOME]: secondHalfSettlementResult.handicapHome,
      [SecondHalfOddsKey.FT_HDP_AWAY]: secondHalfSettlementResult.handicapAway,
      [SecondHalfOddsKey.FT_OU_OVER]: secondHalfSettlementResult.over,
      [SecondHalfOddsKey.FT_OU_UNDER]: secondHalfSettlementResult.under,
      [SecondHalfOddsKey.FT_OE_ODD]:
        finalFirstHalfSettlementResult[FirstHalfOddsKey.FT_OE_EVEN] === SettlementStatus.WIN
          ? secondHalfSettlementResult.odd
          : secondHalfSettlementResult.even,
      [SecondHalfOddsKey.FT_OE_EVEN]:
        finalFirstHalfSettlementResult[FirstHalfOddsKey.FT_OE_EVEN] === SettlementStatus.WIN
          ? secondHalfSettlementResult.even
          : secondHalfSettlementResult.odd,

      [SecondHalfOddsKey.FT_HOME_OVER]: secondHalfSettlementResult.homeOver,
      [SecondHalfOddsKey.FT_HOME_UNDER]: secondHalfSettlementResult.homeUnder,
      [SecondHalfOddsKey.FT_AWAY_OVER]: secondHalfSettlementResult.awayOver,
      [SecondHalfOddsKey.FT_AWAY_UNDER]: secondHalfSettlementResult.awayUnder,
    };
  };

  getSettlementResultForUltraLive = (
    roundResult: RoundResultType,
    matchConfigsDetail: MatchConfigsDetailType
  ): RoundSettlementResultType => {
    const firstHalfSettlementResults: DrawSettlementResultType[] = [];
    const secondHalfSettlementResults: DrawSettlementResultType[] = [];

    matchConfigsDetail.firstHalfMatchConfigs.forEach((matchConfig, index) => {
      const liveScore = resultHelper.combineResults(
        roundResult.firstHalfResults.slice(0, index).map((result) => result.result)
      );
      const firstHalfSettlementResult = this.getSettlementResultForFirstHalf(roundResult, matchConfig, liveScore);
      firstHalfSettlementResults.push(firstHalfSettlementResult);
    });

    matchConfigsDetail.secondHalfMatchConfigs.forEach((matchConfig, index) => {
      const liveScore = resultHelper.combineResults(
        roundResult.secondHalfResults.slice(0, index).map((result) => result.result)
      );
      const secondHalfSettlementResult = this.getSettlementResultForSecondHalf(
        roundResult,
        matchConfig,
        firstHalfSettlementResults[0],
        liveScore
      );
      secondHalfSettlementResults.push(secondHalfSettlementResult);
    });

    return [...firstHalfSettlementResults, ...secondHalfSettlementResults];
  };

  getSettlementResultFromResultStringWithLiveScore = (
    resultString: string,
    liveScore: string,
    settleConfig: SettleConfig
  ) => {
    const homeGoals = resultString.split("H").length - 1;
    const awayGoals = resultString.split("A").length - 1;
    const liveHomeGoals = liveScore.split("H").length - 1;
    const liveAwayGoals = liveScore.split("A").length - 1;

    const overUnderValue = settleConfig.overUnderValue + liveHomeGoals + liveAwayGoals;
    const totalGoals = homeGoals + awayGoals;
    const hdpResult = resultHelper.getHandicapResult(
      homeGoals - liveHomeGoals,
      awayGoals - liveAwayGoals,
      settleConfig.handicapValue
    );
    const o1x2Result = resultHelper.get1X2Result(homeGoals, awayGoals);
    const ouResult = resultHelper.getOverUnderResult(totalGoals, overUnderValue);
    const oeResult = resultHelper.getOddEvenResult(totalGoals);
    const teamOverUnderResult = resultHelper.getTeamOverUnderResult(
      homeGoals,
      awayGoals,
      settleConfig.homeOverUnderValue,
      settleConfig.awayOverUnderValue
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
}
