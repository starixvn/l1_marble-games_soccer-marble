import { RateConfig, MatchConfigType, SettlementStatus, Selection } from "../types";

export const parseScore = (score: string): [number, number] => {
  const [home, away] = score.split("-").map(Number);
  return [home, away];
};

export const roundToPrecision = (value: number, precision = 100) => {
  return Math.floor(value * precision) / precision;
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

const calculateAverageScore = (scoreRates: Record<string, number>) => {
  const totalRates = Object.values(scoreRates).reduce((sum, rate) => sum + rate, 0);

  let homeScore = 0,
    awayScore = 0;

  for (const [score, rate] of Object.entries(scoreRates)) {
    const [homeGoals, awayGoals] = parseScore(score);
    homeScore += homeGoals * rate;
    awayScore += awayGoals * rate;
  }

  homeScore = roundToPrecision(homeScore / totalRates, 100);
  awayScore = roundToPrecision(awayScore / totalRates, 100);

  return { homeScore, awayScore };
};

export const calculateProbabilitiesForBetChoices = (scoreRates: Record<string, number>) => {
  const totalRates = Object.values(scoreRates).reduce((sum, rate) => sum + rate, 0);

  let hdpHome = 0,
    hdpAway = 0,
    hdpDraw = 0,
    home = 0,
    away = 0,
    draw = 0,
    over = 0,
    under = 0,
    odd = 0,
    even = 0;

  const { homeScore, awayScore } = calculateAverageScore(scoreRates);
  const handicapValue = calculateHandicapValue(homeScore, awayScore);
  const overUnderValue = calculateOverUnderValue(homeScore, awayScore);

  for (const [score, rate] of Object.entries(scoreRates)) {
    const [homeGoals, awayGoals] = parseScore(score);
    const totalGoals = homeGoals + awayGoals;

    if (homeGoals > awayGoals) {
      home += rate;
    } else if (homeGoals < awayGoals) {
      away += rate;
    } else {
      draw += rate;
    }

    if (homeGoals + handicapValue > awayGoals) {
      hdpHome += rate;
    } else if (homeGoals + handicapValue < awayGoals) {
      hdpAway += rate;
    } else {
      hdpDraw += rate;
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
      hdp_home: hdpHome / totalRates,
      hdp_away: hdpAway / totalRates,
      hdp_draw: hdpDraw / totalRates,
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

export const calculateHandicapValue = (homeScore: number, awayScore: number) => {
  return Math.floor(awayScore - homeScore) + 0.5;
};

export const calculateOverUnderValue = (homeScore: number, awayScore: number) => {
  return Math.floor(homeScore + awayScore) + 0.5;
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

export const calculateOddsForRound = (matchConfig: MatchConfigType, firstHalfResult: string) => {
  const fhHomeGoals = firstHalfResult.split("H").length - 1;
  const fhAwayGoals = firstHalfResult.split("A").length - 1;
  const fhTotalGoals = fhHomeGoals + fhAwayGoals;

  const fulltime = calculateFulltimeOdds({
    firstHalf: matchConfig.firstHalf,
    secondHalf: matchConfig.secondHalf,
  } as MatchConfigType);

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
    ft_oe_odd: fhTotalGoals % 2 === 0 ? secondHalf.odds.odd : secondHalf.odds.even,
    ft_oe_even: fhTotalGoals % 2 === 0 ? secondHalf.odds.even : secondHalf.odds.odd,
  };

  const updatedMatchConfig = {
    ...matchConfig,
    overUnderValue: fulltime.overUnderValue,
    handicapValue: fulltime.handicapValue,
    firstHalf: updatedFirstHalf,
    secondHalf: updatedSecondHalf,
  };

  const firstHalfSelections: Record<string, Selection> = {};
  const secondHalfSelections: Record<string, Selection> = {};

  Object.entries(firstHalfOdds).forEach(([key, value]) => {
    const selection: Selection = {
      name: key,
      price: value,
      point: 0,
      settlementStatus: SettlementStatus.PLAY,
    };

    firstHalfSelections[key] = selection;
  });

  firstHalfSelections["ft_hdp_home"].point = fulltime.handicapValue;
  firstHalfSelections["ft_hdp_away"].point = -fulltime.handicapValue;
  firstHalfSelections["h1_hdp_home"].point = firstHalf.handicapValue;
  firstHalfSelections["h1_hdp_away"].point = -firstHalf.handicapValue;
  firstHalfSelections["ft_ou_over"].point = fulltime.overUnderValue;
  firstHalfSelections["ft_ou_under"].point = fulltime.overUnderValue;
  firstHalfSelections["h1_ou_over"].point = firstHalf.overUnderValue;
  firstHalfSelections["h1_ou_under"].point = firstHalf.overUnderValue;

  Object.entries(secondHalfOdds).forEach(([key, value]) => {
    const selection: Selection = {
      name: key,
      price: value,
      point: 0,
      settlementStatus: SettlementStatus.PLAY,
    };

    secondHalfSelections[key] = selection;
  });

  secondHalfSelections["ft_hdp_home"].point = secondHalf.handicapValue;
  secondHalfSelections["ft_hdp_away"].point = -secondHalf.handicapValue;
  secondHalfSelections["ft_ou_over"].point = secondHalf.overUnderValue + fhTotalGoals;
  secondHalfSelections["ft_ou_under"].point = secondHalf.overUnderValue + fhTotalGoals;

  return {
    odds: [firstHalfOdds, secondHalfOdds],
    matchConfig: updatedMatchConfig,
    selections: [firstHalfSelections, secondHalfSelections],
  };
};
