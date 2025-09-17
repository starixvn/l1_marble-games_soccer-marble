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
} from "@soccer-marble/shared-types";

type SettleConfig = {
  overUnderValue: number;
  handicapValue: number;
  homeOverUnderValue: number;
  awayOverUnderValue: number;
};

export const generateResult = (data: DataResultType): RoundResultType => {
  const numberOfVideos = data.numberOfVideos;
  const firstHalf = generateResultForHalf(data.matchConfig.firstHalf);
  const secondHalf = generateResultForHalf(data.matchConfig.secondHalf);
  const videoInfo = getVideoInfoFromResult(firstHalf.goalSequence, secondHalf.goalSequence, numberOfVideos);

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

export const getSettlementResult = (
  roundResult: RoundResultType,
  matchConfig: MatchConfigType
): RoundSettlementResultType => {
  const firstHalfResult = roundResult.drawResults[0].result.goalSequence;
  const secondHalfResult = roundResult.drawResults[1].result.goalSequence;
  const fullTimeResult = firstHalfResult + secondHalfResult;

  const firstHalfSettlementResult = getSettlementResultFromResultString(firstHalfResult, {
    overUnderValue: matchConfig.firstHalf.overUnderValue,
    handicapValue: matchConfig.firstHalf.handicapValue,
    homeOverUnderValue: matchConfig.firstHalf.homeOverUnderValue,
    awayOverUnderValue: matchConfig.firstHalf.awayOverUnderValue,
  });

  const fullTimeSettlementResult = getSettlementResultFromResultString(fullTimeResult, {
    overUnderValue: matchConfig.overUnderValue,
    handicapValue: matchConfig.handicapValue,
    homeOverUnderValue: matchConfig.homeOverUnderValue,
    awayOverUnderValue: matchConfig.awayOverUnderValue,
  });

  return [firstHalfSettlementResult, fullTimeSettlementResult];
};

const getHandicapResult = (homeGoals: number, awayGoals: number, handicapValue: number) => {
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

const get1X2Result = (homeGoals: number, awayGoals: number) => {
  return {
    home: homeGoals > awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    away: awayGoals > homeGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    draw: homeGoals === awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
  };
};

const getOverUnderResult = (totalGoals: number, overUnderValue: number) => {
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

const getOddEvenResult = (totalGoals: number) => {
  return {
    odd: totalGoals % 2 === 1 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    even: totalGoals % 2 === 0 ? SettlementStatus.WIN : SettlementStatus.LOSE,
  };
};

const getTeamOverUnderResult = (
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

const getSettlementResultFromResultString = (resultString: string, settleConfig: SettleConfig) => {
  const homeGoals = resultString.split("H").length - 1;
  const awayGoals = resultString.split("A").length - 1;
  const totalGoals = homeGoals + awayGoals;

  const hdpResult = getHandicapResult(homeGoals, awayGoals, settleConfig.handicapValue);
  const o1x2Result = get1X2Result(homeGoals, awayGoals);
  const ouResult = getOverUnderResult(totalGoals, settleConfig.overUnderValue);
  const oeResult = getOddEvenResult(totalGoals);
  const teamOverUnderResult = getTeamOverUnderResult(
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

const generateResultForHalf = (halfConfig: HalfConfigType) => {
  const scoreResult = getScoreFromScoreRate(halfConfig.scoreRate);
  const [homeGoals, awayGoals] = scoreResult.split("-").map(Number);
  const sequence = Array(homeGoals).fill("H").concat(Array(awayGoals).fill("A"));
  const result = secureShuffle(sequence).join("");

  return {
    goalSequence: result || "0",
    finalScore: `${homeGoals}:${awayGoals}`,
  };
};

export const getScoreFromScoreRate = (scoreRate: Record<string, number>) => {
  const score = Object.keys(scoreRate);
  const rate = Object.values(scoreRate);
  return secureWeightedPick(score, rate);
};

const getVideoInfoFromResult = (firstHalf: string, secondHalf: string, numberOfVideos: Record<string, number>) => {
  const firstHalfVideo = generateVideoName(firstHalf, numberOfVideos);
  const secondHalfVideo = generateVideoName(secondHalf, numberOfVideos);

  return {
    firstHalfVideo,
    secondHalfVideo,
  };
};

export const generateVideoName = (
  result: string,
  numberOfVideos: Record<string, number>,
  videoDefault = false,
  ignoredVideo = ""
) => {
  const currentNumberOfVideos = numberOfVideos[result] || 1;
  let videoIndex = videoDefault ? 0 : secureRandomRange(0, currentNumberOfVideos - 1);
  let videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");

  if (videoName === ignoredVideo && !videoDefault) {
    videoIndex = (videoIndex + 1) % currentNumberOfVideos;
    videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");
  }

  return videoName;
};
