import { RateConfig, SettlementStatus, FirstHalfOddsKey, SecondHalfOddsKey } from "@soccer-marble/shared-types";

type BetChoices =
  | "hdpHome"
  | "hdpAway"
  | "home"
  | "away"
  | "draw"
  | "over"
  | "under"
  | "even"
  | "odd"
  | "homeOver"
  | "awayOver"
  | "homeUnder"
  | "awayUnder";

export const parseScore = (score: string): [number, number] => {
  const [home, away] = score.split("-").map(Number);
  return [home, away];
};

export const roundToPrecision = (value: number, precision = 100) => {
  return Math.floor(value * precision) / precision;
};

export const calculateHandicapValue = (homeScore: number, awayScore: number) => {
  return Math.floor(awayScore - homeScore) + 0.5;
};

export const calculateOverUnderValue = (homeScore: number, awayScore: number) => {
  return Math.floor(homeScore + awayScore) + 0.5;
};

const calculateAverageScore = (scoreRates: Record<string, number>) => {
  const totalRates = Object.values(scoreRates).reduce((sum, rate) => sum + rate, 0);

  let homeScore = 0,
    awayScore = 0;

  for (const [score, rate] of Object.entries(scoreRates)) {
    const [homeGoals, awayGoals] = parseScore(score);
    homeScore += homeGoals * rate;
    awayScore += awayGoals * rate;
  }

  homeScore = roundToPrecision(homeScore / totalRates, 10000);
  awayScore = roundToPrecision(awayScore / totalRates, 10000);

  return { homeScore, awayScore };
};

const update1X2 = (counters: Record<BetChoices, number>, home: number, away: number, rate: number) => {
  if (home > away) {
    counters.home += rate;
  } else if (home < away) {
    counters.away += rate;
  } else {
    counters.draw += rate;
  }
};

const updateHandicap = (
  counters: Record<BetChoices, number>,
  homeGoals: number,
  awayGoals: number,
  handicapValue: number,
  rate: number
) => {
  const homeHDP = homeGoals + handicapValue;
  if (homeHDP > awayGoals) {
    counters.hdpHome += rate;
  } else if (homeHDP < awayGoals) {
    counters.hdpAway += rate;
  }
};

const updateOverUnder = (
  counters: Record<BetChoices, number>,
  totalGoals: number,
  overUnderValue: number,
  rate: number
) => {
  if (totalGoals > overUnderValue) {
    counters.over += rate;
  } else if (totalGoals < overUnderValue) {
    counters.under += rate;
  }
};

const updateEvenOdd = (counters: Record<BetChoices, number>, totalGoals: number, rate: number) => {
  if (totalGoals % 2 === 0) {
    counters.even += rate;
  } else {
    counters.odd += rate;
  }
};

const updateTeamOverUnder = (
  counters: Record<BetChoices, number>,
  homeGoals: number,
  awayGoals: number,
  homeOverUnderValue: number,
  awayOverUnderValue: number,
  rate: number
) => {
  if (homeGoals > homeOverUnderValue) {
    counters.homeOver += rate;
  } else if (homeGoals < homeOverUnderValue) {
    counters.homeUnder += rate;
  }

  if (awayGoals > awayOverUnderValue) {
    counters.awayOver += rate;
  } else if (awayGoals < awayOverUnderValue) {
    counters.awayUnder += rate;
  }
};

export const calculateProbabilitiesForBetChoices = (scoreRates: Record<string, number>, addingScore = "0-0") => {
  const totalRates = Object.values(scoreRates).reduce((sum, rate) => sum + rate, 0);
  const [addingHome, addingAway] = parseScore(addingScore);

  const { homeScore, awayScore } = calculateAverageScore(scoreRates);
  const handicapValue = calculateHandicapValue(homeScore, awayScore);
  const overUnderValue = calculateOverUnderValue(homeScore, awayScore);

  const homeOverUnderValue = calculateOverUnderValue(homeScore, 0);
  const awayOverUnderValue = calculateOverUnderValue(0, awayScore);

  const counters: Record<BetChoices, number> = {
    hdpHome: 0,
    hdpAway: 0,
    home: 0,
    away: 0,
    draw: 0,
    over: 0,
    under: 0,
    even: 0,
    odd: 0,
    homeOver: 0,
    awayOver: 0,
    homeUnder: 0,
    awayUnder: 0,
  };

  for (const [score, rate] of Object.entries(scoreRates)) {
    const [homeGoals, awayGoals] = parseScore(score);
    const totalGoals = homeGoals + awayGoals;
    const addedHome = homeGoals + addingHome;
    const addedAway = awayGoals + addingAway;

    update1X2(counters, addedHome, addedAway, rate);

    updateHandicap(counters, homeGoals, awayGoals, handicapValue, rate);

    updateOverUnder(counters, totalGoals, overUnderValue, rate);

    updateEvenOdd(counters, totalGoals, rate);

    updateTeamOverUnder(counters, homeGoals, awayGoals, homeOverUnderValue, awayOverUnderValue, rate);
  }

  const probabilities = Object.keys(counters).reduce((result, key) => {
    result[key as BetChoices] = counters[key as BetChoices] / totalRates;
    return result;
  }, {} as Record<BetChoices, number>);

  return {
    probabilities,
    overUnderValue,
    handicapValue,
    homeOverUnderValue,
    awayOverUnderValue,
  };
};

export const calculateBetOdds = (probabilities: Record<string, number>): Record<string, number> => {
  return Object.keys(probabilities).reduce((result, betChoice) => {
    const prob = probabilities[betChoice];
    result[betChoice] = probabilityToBetRawOdds(prob);
    return result;
  }, {} as Record<string, number>);
};

export const probabilityToBetRawOdds = (prob: number): number => {
  if (prob <= 0 || prob >= 1) {
    return 0;
  }

  const odds = 1 / prob;

  return roundToPrecision(odds);
};
