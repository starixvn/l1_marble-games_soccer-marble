import { secureRandomRange, secureWeightedPick } from "sc-core-rng";
import { ResultType, SettlementStatus } from "../types";
import crypto from "crypto";

export const getHandicapResult = (homeGoals: number, awayGoals: number, handicapValue: number) => {
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

export const get1X2Result = (homeGoals: number, awayGoals: number) => {
  return {
    home: homeGoals > awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    away: awayGoals > homeGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
    draw: homeGoals === awayGoals ? SettlementStatus.WIN : SettlementStatus.LOSE,
  };
};

export const getOverUnderResult = (totalGoals: number, overUnderValue: number) => {
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

export const getOddEvenResult = (totalGoals: number) => {
  return {
    odd: totalGoals % 2 === 1 ? SettlementStatus.WIN : SettlementStatus.LOSE,
    even: totalGoals % 2 === 0 ? SettlementStatus.WIN : SettlementStatus.LOSE,
  };
};

export const getTeamOverUnderResult = (
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

export const combineResults = (results: ResultType[]): ResultType => {
  const goalSequence = results
    .map((result) => result.goalSequence)
    .join("")
    .replace("0", "");
  const fhHomeGoals = goalSequence.split("H").length - 1;
  const fhAwayGoals = goalSequence.split("A").length - 1;

  return {
    goalSequence: goalSequence || "0",
    finalScore: `${fhHomeGoals}-${fhAwayGoals}`,
  };
};

export const getScoreFromScoreRate = (scoreRate: Record<string, number>) => {
  const score = Object.keys(scoreRate);
  const rate = Object.values(scoreRate);

  return secureWeightedPick(score, rate);
};

export const generateVideoName = (result: string, numberOfVideos: number, ignoredVideo = "") => {
  let videoIndex = secureRandomRange(0, numberOfVideos - 1);
  let videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");

  if (videoName === ignoredVideo && numberOfVideos > 1) {
    videoIndex = (videoIndex + 1) % numberOfVideos;
    videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");
  }

  return videoName;
};
