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
    [FirstHalfOddsKey.FT_HDP_HOME]: fullTimeSettlementResult.handicapHome,
    [FirstHalfOddsKey.FT_HDP_AWAY]: fullTimeSettlementResult.handicapAway,
    [FirstHalfOddsKey.FT_1X2_HOME]: fullTimeSettlementResult.home,
    [FirstHalfOddsKey.FT_1X2_AWAY]: fullTimeSettlementResult.away,
    [FirstHalfOddsKey.FT_1X2_DRAW]: fullTimeSettlementResult.draw,
    [FirstHalfOddsKey.FT_OU_OVER]: fullTimeSettlementResult.over,
    [FirstHalfOddsKey.FT_OU_UNDER]: fullTimeSettlementResult.under,
    [FirstHalfOddsKey.FT_OE_ODD]: fullTimeSettlementResult.odd,
    [FirstHalfOddsKey.FT_OE_EVEN]: fullTimeSettlementResult.even,
    [FirstHalfOddsKey.FT_TG_02]: fullTimeSettlementResult.tg02,
    [FirstHalfOddsKey.FT_TG_34]: fullTimeSettlementResult.tg34,
    [FirstHalfOddsKey.FT_TG_56]: fullTimeSettlementResult.tg56,
    [FirstHalfOddsKey.FT_TG_7]: fullTimeSettlementResult.tg7,

    [FirstHalfOddsKey.H1_HDP_HOME]: firstHalfSettlementResult.handicapHome,
    [FirstHalfOddsKey.H1_HDP_AWAY]: firstHalfSettlementResult.handicapAway,
    [FirstHalfOddsKey.H1_1X2_HOME]: firstHalfSettlementResult.home,
    [FirstHalfOddsKey.H1_1X2_AWAY]: firstHalfSettlementResult.away,
    [FirstHalfOddsKey.H1_1X2_DRAW]: firstHalfSettlementResult.draw,
    [FirstHalfOddsKey.H1_OU_OVER]: firstHalfSettlementResult.over,
    [FirstHalfOddsKey.H1_OU_UNDER]: firstHalfSettlementResult.under,
    [FirstHalfOddsKey.H1_OE_ODD]: firstHalfSettlementResult.odd,
    [FirstHalfOddsKey.H1_OE_EVEN]: firstHalfSettlementResult.even,
    [FirstHalfOddsKey.H1_TG_01]: firstHalfSettlementResult.tg01,
    [FirstHalfOddsKey.H1_TG_23]: firstHalfSettlementResult.tg23,
    [FirstHalfOddsKey.H1_TG_4]: firstHalfSettlementResult.tg4,
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
    [SecondHalfOddsKey.FT_TG_02]: fullTimeSettlementResult.tg02,
    [SecondHalfOddsKey.FT_TG_34]: fullTimeSettlementResult.tg34,
    [SecondHalfOddsKey.FT_TG_56]: fullTimeSettlementResult.tg56,
    [SecondHalfOddsKey.FT_TG_7]: fullTimeSettlementResult.tg7,
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

  const totalGoals = homeGoals + awayGoals;
  const isOver = totalGoals > overUnderValue;
  const isUnder = totalGoals < overUnderValue;
  const isOdd = totalGoals % 2 === 1;

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
    tg01: totalGoals <= 1 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    tg23: 2 <= totalGoals && totalGoals <= 3 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    tg4: totalGoals >= 4 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    tg02: totalGoals <= 2 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    tg34: 3 <= totalGoals && totalGoals <= 4 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    tg56: 5 <= totalGoals && totalGoals <= 6 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    tg7: totalGoals >= 7 ? SettlementStatus.WIN : SettlementStatus.LOSE,
  };
};

export const generateRawResultForHash = () => {};

export const generateResultForHalf = (halfConfig: HalfConfigType) => {
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
  const currentNumberOfVideos = numberOfVideos[result] || gameSettings.numberOfVideos[result];
  let videoIndex = videoDefault ? 0 : secureRandomRange(0, currentNumberOfVideos - 1);
  let videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");

  if (videoName === ignoredVideo && !videoDefault) {
    videoIndex = (videoIndex + 1) % currentNumberOfVideos;
    videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");
  }

  return videoName;
};
