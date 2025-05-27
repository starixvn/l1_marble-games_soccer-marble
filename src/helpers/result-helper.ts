import Chance from "chance";
import crypto from "crypto";
import { secureShuffle, secureWeightedPick } from "sc-core-rng";
import {
  RoundResultType,
  DataResultType,
  RoundSettlementResultType,
  HalfConfigType,
  DrawResultType,
  MatchConfigType,
  SettlementStatus,
} from "../types";

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
  const firstHalf = roundResult.drawResults[0].result;
  const secondHalf = roundResult.drawResults[1].result;

  const firstHalfSettlementResult = getSettlementResultFromResultString(
    firstHalf.goalSequence,
    matchConfig.firstHalf.overUnderValue,
    matchConfig.firstHalf.handicapValue
  );
  const secondHalfSettlementResult = getSettlementResultFromResultString(
    secondHalf.goalSequence,
    matchConfig.secondHalf.overUnderValue,
    matchConfig.secondHalf.handicapValue
  );
  const fullTimeSettlementResult = getSettlementResultFromResultString(
    firstHalf.goalSequence + secondHalf.goalSequence,
    matchConfig.overUnderValue,
    matchConfig.handicapValue
  );

  const finalFirstHalfSettlementResult = {
    ft_hdp_home: fullTimeSettlementResult.handicapHome,
    ft_hdp_away: fullTimeSettlementResult.handicapAway,
    ft_1x2_home: fullTimeSettlementResult.home,
    ft_1x2_away: fullTimeSettlementResult.away,
    ft_1x2_draw: fullTimeSettlementResult.draw,
    ft_ou_over: fullTimeSettlementResult.over,
    ft_ou_under: fullTimeSettlementResult.under,
    ft_oe_odd: fullTimeSettlementResult.odd,
    ft_oe_even: fullTimeSettlementResult.even,

    h1_hdp_home: firstHalfSettlementResult.handicapHome,
    h1_hdp_away: firstHalfSettlementResult.handicapAway,
    h1_1x2_home: firstHalfSettlementResult.home,
    h1_1x2_away: firstHalfSettlementResult.away,
    h1_1x2_draw: firstHalfSettlementResult.draw,
    h1_ou_over: firstHalfSettlementResult.over,
    h1_ou_under: firstHalfSettlementResult.under,
    h1_oe_odd: firstHalfSettlementResult.odd,
    h1_oe_even: firstHalfSettlementResult.even,
  };

  const finalSecondHalfSettlementResult = {
    ft_hdp_home: secondHalfSettlementResult.handicapHome,
    ft_hdp_away: secondHalfSettlementResult.handicapAway,
    ft_ou_over: secondHalfSettlementResult.over,
    ft_ou_under: secondHalfSettlementResult.under,
    ft_oe_odd:
      firstHalfSettlementResult.even === SettlementStatus.WIN
        ? secondHalfSettlementResult.odd
        : secondHalfSettlementResult.even,
    ft_oe_even:
      firstHalfSettlementResult.even === SettlementStatus.WIN
        ? secondHalfSettlementResult.even
        : secondHalfSettlementResult.odd,
  };

  return [finalFirstHalfSettlementResult, finalSecondHalfSettlementResult];
};

const getHandicapResult = (isHome: boolean, homeGoals: number, awayGoals: number, handicapValue: number) => {
  const adjustedHomeGoals = homeGoals + handicapValue;

  if (adjustedHomeGoals === awayGoals) {
    return SettlementStatus.DRAW;
  }

  const isWin = isHome ? adjustedHomeGoals > awayGoals : adjustedHomeGoals < awayGoals;

  return isWin ? SettlementStatus.WIN : SettlementStatus.LOSE;
};

const getSettlementResultFromResultString = (resultString: string, overUnderValue: number, handicapValue: number) => {
  const homeGoals = resultString.split("H").length - 1;
  const awayGoals = resultString.split("A").length - 1;

  const isOver = homeGoals + awayGoals > overUnderValue;
  const isUnder = homeGoals + awayGoals < overUnderValue;
  const isOdd = (homeGoals + awayGoals) % 2 === 1;

  return {
    handicapHome: getHandicapResult(true, homeGoals, awayGoals, handicapValue),
    handicapAway: getHandicapResult(false, homeGoals, awayGoals, handicapValue),
    home: homeGoals > awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    away: awayGoals > homeGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    draw: homeGoals === awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    over: isOver ? SettlementStatus.WIN : isUnder ? SettlementStatus.LOSE : SettlementStatus.DRAW,
    under: isUnder ? SettlementStatus.WIN : isOver ? SettlementStatus.LOSE : SettlementStatus.DRAW,
    odd: isOdd ? SettlementStatus.WIN : SettlementStatus.LOSE,
    even: !isOdd ? SettlementStatus.WIN : SettlementStatus.LOSE,
  };
};

export const generateRawResultForHash = () => {};

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
  const secondHalfVideo = generateVideoName(secondHalf, numberOfVideos, false, firstHalfVideo);

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
  const chance = new Chance();
  const currentNumberOfVideos = numberOfVideos[result];
  let videoIndex = videoDefault ? 0 : chance.integer({ min: 1, max: currentNumberOfVideos }) - 1;
  let videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");

  if (videoName === ignoredVideo && !videoDefault) {
    videoIndex = (videoIndex + 1) % currentNumberOfVideos;
    videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");
  }

  return videoName;
};
