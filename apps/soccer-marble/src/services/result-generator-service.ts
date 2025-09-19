import crypto from "crypto";
import { secureShuffle, secureWeightedPick, secureRandomRange } from "sc-core-rng";
import {
  RoundResultType,
  DataResultType,
  RoundSettlementResultType,
  HalfConfigType,
  DrawResultType,
  MatchConfigType,
  SettlementStatus,
  FirstHalfOddsKey,
  SecondHalfOddsKey,
} from "../types";
import { gameSettings } from "../game-config";

type SettleConfig = {
  overUnderValue: number;
  handicapValue: number;
  homeOverUnderValue: number;
  awayOverUnderValue: number;
};

export class ResultGeneratorService {
  generateResult = (data: DataResultType): RoundResultType => {
    const numberOfVideos = data.numberOfVideos;
    const firstHalf = this.generateResultForHalf(data.matchConfig.firstHalf);
    const secondHalf = this.generateResultForHalf(data.matchConfig.secondHalf);
    const videoInfo = this.getVideoInfoFromResult(firstHalf.goalSequence, secondHalf.goalSequence, numberOfVideos);

    const firstHalfResult: DrawResultType = {
      playlist: videoInfo.firstHalfVideo,
      goalInfo: videoInfo.firstHalfVideo,
      result: firstHalf,
    };

    const secondHalfResult: DrawResultType = {
      playlist: videoInfo.secondHalfVideo,
      goalInfo: videoInfo.secondHalfVideo,
      result: secondHalf,
    };

    return {
      drawResults: [firstHalfResult, secondHalfResult],
    };
  };

  getSettlementResult = (roundResult: RoundResultType, matchConfig: MatchConfigType): RoundSettlementResultType => {
    const firstHalf = roundResult.drawResults[0].result;
    const secondHalf = roundResult.drawResults[1].result;

    const firstHalfSettlementResult = this.getSettlementResultFromResultString(firstHalf.goalSequence, {
      overUnderValue: matchConfig.firstHalf.overUnderValue,
      handicapValue: matchConfig.firstHalf.handicapValue,
      homeOverUnderValue: matchConfig.firstHalf.homeOverUnderValue,
      awayOverUnderValue: matchConfig.firstHalf.awayOverUnderValue,
    });
    const secondHalfSettlementResult = this.getSettlementResultFromResultString(secondHalf.goalSequence, {
      overUnderValue: matchConfig.secondHalf.overUnderValue,
      handicapValue: matchConfig.secondHalf.handicapValue,
      homeOverUnderValue: matchConfig.secondHalf.homeOverUnderValue,
      awayOverUnderValue: matchConfig.secondHalf.awayOverUnderValue,
    });
    const fullTimeSettlementResult = this.getSettlementResultFromResultString(
      firstHalf.goalSequence + secondHalf.goalSequence,
      {
        overUnderValue: matchConfig.overUnderValue,
        handicapValue: matchConfig.handicapValue,
        homeOverUnderValue: matchConfig.homeOverUnderValue,
        awayOverUnderValue: matchConfig.awayOverUnderValue,
      }
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
      [SecondHalfOddsKey.FT_OE_ODD]:
        firstHalfSettlementResult.even === SettlementStatus.WIN
          ? secondHalfSettlementResult.odd
          : secondHalfSettlementResult.even,
      [SecondHalfOddsKey.FT_OE_EVEN]:
        firstHalfSettlementResult.even === SettlementStatus.WIN
          ? secondHalfSettlementResult.even
          : secondHalfSettlementResult.odd,

      [SecondHalfOddsKey.FT_HOME_OVER]: secondHalfSettlementResult.homeOver,
      [SecondHalfOddsKey.FT_HOME_UNDER]: secondHalfSettlementResult.homeUnder,
      [SecondHalfOddsKey.FT_AWAY_OVER]: secondHalfSettlementResult.awayOver,
      [SecondHalfOddsKey.FT_AWAY_UNDER]: secondHalfSettlementResult.awayUnder,
    };

    return [finalFirstHalfSettlementResult, finalSecondHalfSettlementResult];
  };

  getHandicapResult = (homeGoals: number, awayGoals: number, handicapValue: number) => {
    const adjustedHomeGoals = homeGoals + handicapValue;

    if (adjustedHomeGoals === awayGoals) {
      return {
        hdpHome: SettlementStatus.DRAW,
        hdpAway: SettlementStatus.DRAW,
      };
    }

    return {
      hdpHome: adjustedHomeGoals > awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
      hdpAway: adjustedHomeGoals < awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    };
  };

  get1X2Result = (homeGoals: number, awayGoals: number) => {
    return {
      home: homeGoals > awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
      away: awayGoals > homeGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
      draw: homeGoals === awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    };
  };

  getOverUnderResult = (totalGoals: number, overUnderValue: number) => {
    if (totalGoals === overUnderValue) {
      return {
        over: SettlementStatus.DRAW,
        under: SettlementStatus.DRAW,
      };
    }

    return {
      over: totalGoals > overUnderValue ? SettlementStatus.WIN : SettlementStatus.LOSE,
      under: totalGoals < overUnderValue ? SettlementStatus.WIN : SettlementStatus.LOSE,
    };
  };

  getOddEvenResult = (totalGoals: number) => {
    return {
      odd: totalGoals % 2 === 1 ? SettlementStatus.WIN : SettlementStatus.LOSE,
      even: totalGoals % 2 === 0 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    };
  };

  getTeamOverUnderResult = (
    homeGoals: number,
    awayGoals: number,
    homeOverUnderValue: number,
    awayOverUnderValue: number
  ) => {
    const isHomeOver = homeGoals > homeOverUnderValue;
    const isAwayOver = awayGoals > awayOverUnderValue;
    const isHomeUnder = homeGoals < homeOverUnderValue;
    const isAwayUnder = awayGoals < awayOverUnderValue;

    return {
      homeOver: isHomeOver ? SettlementStatus.WIN : isHomeUnder ? SettlementStatus.LOSE : SettlementStatus.DRAW,
      awayOver: isAwayOver ? SettlementStatus.WIN : isAwayUnder ? SettlementStatus.LOSE : SettlementStatus.DRAW,
      homeUnder: isHomeUnder ? SettlementStatus.WIN : isHomeOver ? SettlementStatus.LOSE : SettlementStatus.DRAW,
      awayUnder: isAwayUnder ? SettlementStatus.WIN : isAwayOver ? SettlementStatus.LOSE : SettlementStatus.DRAW,
    };
  };

  getSettlementResultFromResultString = (resultString: string, settleConfig: SettleConfig) => {
    const homeGoals = resultString.split("H").length - 1;
    const awayGoals = resultString.split("A").length - 1;
    const totalGoals = homeGoals + awayGoals;
    const hdpResult = this.getHandicapResult(homeGoals, awayGoals, settleConfig.handicapValue);
    const o1x2Result = this.get1X2Result(homeGoals, awayGoals);
    const ouResult = this.getOverUnderResult(totalGoals, settleConfig.overUnderValue);
    const oeResult = this.getOddEvenResult(totalGoals);
    const teamOverUnderResult = this.getTeamOverUnderResult(
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

  generateResultForHalf = (halfConfig: HalfConfigType) => {
    const scoreResult = this.getScoreFromScoreRate(halfConfig.scoreRate);

    const [homeGoals, awayGoals] = scoreResult.split("-").map(Number);
    const sequence = Array(homeGoals).fill("H").concat(Array(awayGoals).fill("A"));

    const result = secureShuffle(sequence).join("");

    return {
      goalSequence: result || "0",
      finalScore: `${homeGoals}:${awayGoals}`,
    };
  };

  getScoreFromScoreRate = (scoreRate: Record<string, number>) => {
    const score = Object.keys(scoreRate);
    const rate = Object.values(scoreRate);

    return secureWeightedPick(score, rate);
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
    const currentNumberOfVideos = numberOfVideos[result] || gameSettings.numberOfVideos[result];
    let videoIndex = videoDefault ? 0 : secureRandomRange(0, currentNumberOfVideos - 1);
    let videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");

    if (videoName === ignoredVideo && !videoDefault) {
      videoIndex = (videoIndex + 1) % currentNumberOfVideos;
      videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");
    }

    return videoName;
  };
}
