import { RateConfig } from "../types";

export const parseScore = (score: string): [number, number] => {
  const [home, away] = score.split("-").map(Number);
  return [home, away];
};

export const floorToPrecision = (value: number, precision = 100) => {
  return Math.floor(value * precision) / precision;
};

export const roundToPrecision = (value: number, precision = 100) => {
  return Math.round(value * precision) / precision;
};

export const mergeTwoScoreRates = (firstHalf: RateConfig, secondHalf: RateConfig): RateConfig => {
  const mergeScoreRates: Record<string, number> = {};

  for (const [fhScore, fhRate] of Object.entries(firstHalf.scoreRate)) {
    const [fhHome, fhAway] = parseScore(fhScore);

    for (const [shScore, shRate] of Object.entries(secondHalf.scoreRate)) {
      const [shHome, shAway] = parseScore(shScore);
      const finalScore = `${fhHome + shHome}-${fhAway + shAway}`;
      const combinedRate = fhRate * shRate;

      mergeScoreRates[finalScore] = (mergeScoreRates[finalScore] || 0) + combinedRate;
    }
  }

  return {
    scoreRate: mergeScoreRates,
  };
};

export const mergeArrayOfRates = (rates: RateConfig[]): RateConfig => {
  let mergeScoreRates = rates[0];

  for (let i = 1; i < rates.length; i++) {
    mergeScoreRates = mergeTwoScoreRates(mergeScoreRates, rates[i]);
  }

  return mergeScoreRates;
};

export const calculateAverageScore = (scoreRates: Record<string, number>) => {
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

export const probabilityToBetRawOdds = (prob: number): number => {
  if (prob <= 0 || prob >= 1) {
    return 0;
  }

  const odds = 1 / prob;
  return floorToPrecision(odds);
};
