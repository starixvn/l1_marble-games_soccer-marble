import { RateConfig, MatchConfigType } from "../types";

export const parseScore = (score: string): [number, number] => {
  const [home, away] = score.split("-").map(Number);
  return [home, away];
};

export const roundToPrecision = (value: number, precision = 100000) => {
  return Math.round(value * precision) / precision;
};

export const calculateFullTimeScoreRates = (firstHalf: RateConfig, secondHalf: RateConfig): Record<string, number> => {
  const fulltimeScoreRates: Record<string, number> = {};

  for (const [fhScore, fhRate] of Object.entries(firstHalf.scoreRate)) {
    const [fhHome, fhAway] = parseScore(fhScore);

    for (const [shScore, shRate] of Object.entries(secondHalf.scoreRate)) {
      const [shHome, shAway] = parseScore(shScore);
      const finalScore = `${fhHome + shHome}-${fhAway + shAway}`;
      const combinedRate = fhRate * shRate;

      fulltimeScoreRates[finalScore] = (fulltimeScoreRates[finalScore] || 0) + combinedRate;
    }
  }

  return fulltimeScoreRates;
};

export const calculateProbabilitiesForBetChoices = (scoreRates: Record<string, number>) => {
  const totalRates = Object.values(scoreRates).reduce((sum, rate) => sum + rate, 0);

  let homeScore = 0,
    awayScore = 0,
    hdp_home = 0,
    hdp_away = 0,
    hdp_draw = 0,
    home = 0,
    away = 0,
    draw = 0,
    over = 0,
    under = 0,
    odd = 0,
    even = 0;

  for (const [score, rate] of Object.entries(scoreRates)) {
    const [homeGoals, awayGoals] = parseScore(score);
    homeScore += homeGoals * rate;
    awayScore += awayGoals * rate;

    if (homeGoals > awayGoals) {
      home += rate;
    } else if (homeGoals < awayGoals) {
      away += rate;
    } else {
      draw += rate;
    }
  }

  homeScore /= totalRates;
  awayScore /= totalRates;

  const handicapValue = Math.round((homeScore - awayScore) / 0.5) * 0.5;
  const overUnderValue = Math.round((homeScore + awayScore) / 0.5) * 0.5;

  for (const [score, rate] of Object.entries(scoreRates)) {
    const [homeGoals, awayGoals] = parseScore(score);
    const totalGoals = homeGoals + awayGoals;

    if (homeGoals + handicapValue > awayGoals) {
      hdp_home += rate;
    } else if (homeGoals + handicapValue < awayGoals) {
      hdp_away += rate;
    } else {
      hdp_draw += rate;
    }

    if (totalGoals > overUnderValue) {
      over += rate;
    } else if (totalGoals < overUnderValue) {
      under += rate;
    }

    if (totalGoals % 2 === 0) {
      even += rate;
    } else {
      odd += rate;
    }
  }

  return {
    probabilities: {
      hdp_home: hdp_home / totalRates,
      hdp_away: hdp_away / totalRates,
      hdp_draw: hdp_draw / totalRates,
      home: home / totalRates,
      away: away / totalRates,
      draw: draw / totalRates,
      over: over / totalRates,
      under: under / totalRates,
      even: even / totalRates,
      odd: odd / totalRates,
    },
    overUnderValue,
    handicapValue,
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
  const odds = 1 / prob;
  return roundToPrecision(odds);
};

export const calculateFulltimeOdds = (matchConfig: MatchConfigType) => {
  const fullTimeScoreRates = calculateFullTimeScoreRates(matchConfig.firstHalf, matchConfig.secondHalf);
  const { probabilities, overUnderValue, handicapValue } = calculateProbabilitiesForBetChoices(fullTimeScoreRates);
  const odds = calculateBetOdds(probabilities);

  return { odds, overUnderValue, handicapValue };
};

export const calculateHalfOdds = (halfConfig: RateConfig) => {
  const { probabilities, overUnderValue, handicapValue } = calculateProbabilitiesForBetChoices(halfConfig.scoreRate);

  const odds = calculateBetOdds(probabilities);

  return { odds, overUnderValue, handicapValue };
};

export const calculateOddsForRound = (matchConfig: MatchConfigType) => {
  const fulltime = calculateFulltimeOdds({
    firstHalf: matchConfig.firstHalf,
    secondHalf: matchConfig.secondHalf,
  });

  const firstHalf = calculateHalfOdds(matchConfig.firstHalf);

  const updatedFirstHalf = {
    ...matchConfig.firstHalf,
    overUnderValue: firstHalf.overUnderValue,
    handicapValue: firstHalf.handicapValue,
  };

  const firstHalfOdds = {
    h1_hdp_home: firstHalf.odds.hdp_home,
    h1_hdp_away: firstHalf.odds.hdp_away,
    h1_1x2_home: firstHalf.odds.home,
    h1_1x2_away: firstHalf.odds.away,
    h1_1x2_draw: firstHalf.odds.draw,
    h1_ou_over: firstHalf.odds.over,
    h1_ou_under: firstHalf.odds.under,
    h1_oe_odd: firstHalf.odds.odd,
    h1_oe_even: firstHalf.odds.even,

    ft_hdp_home: fulltime.odds.hdp_home,
    ft_hdp_away: fulltime.odds.hdp_away,
    ft_1x2_home: fulltime.odds.home,
    ft_1x2_away: fulltime.odds.away,
    ft_1x2_draw: fulltime.odds.draw,
    ft_ou_over: fulltime.odds.over,
    ft_ou_under: fulltime.odds.under,
    ft_oe_odd: fulltime.odds.odd,
    ft_oe_even: fulltime.odds.even,
  };

  const secondHalf = calculateHalfOdds(matchConfig.secondHalf);

  const updatedSecondHalf = {
    ...matchConfig.secondHalf,
    overUnderValue: secondHalf.overUnderValue,
    handicapValue: secondHalf.handicapValue,
  };

  const secondHalfOdds = {
    ft_hdp_home: secondHalf.odds.hdp_home,
    ft_hdp_away: secondHalf.odds.hdp_away,
    ft_ou_over: secondHalf.odds.over,
    ft_ou_under: secondHalf.odds.under,
    ft_oe_odd: secondHalf.odds.odd,
    ft_oe_even: secondHalf.odds.even,
  };

  const updatedMatchConfig = {
    ...matchConfig,
    overUnderValue: fulltime.overUnderValue,
    handicapValue: fulltime.handicapValue,
    firstHalf: updatedFirstHalf,
    secondHalf: updatedSecondHalf,
  };

  return {
    odds: [firstHalfOdds, secondHalfOdds],
    matchConfig: updatedMatchConfig,
  };
};
