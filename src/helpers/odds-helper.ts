import { RateConfig, MatchConfigType, SettlementStatus, Selection, FirstHalfOddsKey, SecondHalfOddsKey } from "../types";

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
  | "tg01"
  | "tg02"
  | "tg23"
  | "tg34"
  | "tg4"
  | "tg56"
  | "tg7"
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

const updateOverUnder = (counters: Record<BetChoices, number>, totalGoals: number, overUnderValue: number, rate: number) => {
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

const updateTotalGoals = (counters: Record<BetChoices, number>, totalGoalsWithAdding: number, rate: number) => {
  if (totalGoalsWithAdding <= 1) {
    counters.tg01 += rate;
    counters.tg02 += rate;
  } else if (totalGoalsWithAdding === 2) {
    counters.tg02 += rate;
    counters.tg23 += rate;
  } else if (totalGoalsWithAdding === 3) {
    counters.tg34 += rate;
    counters.tg23 += rate;
  } else if (totalGoalsWithAdding === 4) {
    counters.tg4 += rate;
    counters.tg34 += rate;
  } else if (totalGoalsWithAdding <= 6) {
    counters.tg56 += rate;
  } else {
    counters.tg7 += rate;
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
    tg01: 0,
    tg02: 0,
    tg23: 0,
    tg34: 0,
    tg4: 0,
    tg56: 0,
    tg7: 0,
    homeOver: 0,
    awayOver: 0,
    homeUnder: 0,
    awayUnder: 0,
  };

  for (const [score, rate] of Object.entries(scoreRates)) {
    const [homeGoals, awayGoals] = parseScore(score);
    const totalGoals = homeGoals + awayGoals;
    const totalGoalsWithAdding = totalGoals + addingHome + addingAway;
    const addedHome = homeGoals + addingHome;
    const addedAway = awayGoals + addingAway;

    update1X2(counters, addedHome, addedAway, rate);

    updateHandicap(counters, homeGoals, awayGoals, handicapValue, rate);

    updateOverUnder(counters, totalGoals, overUnderValue, rate);

    updateEvenOdd(counters, totalGoals, rate);

    updateTotalGoals(counters, totalGoalsWithAdding, rate);

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
  if (prob <= 0 || prob >= 1) {
    return 0;
  }

  const odds = 1 / prob;
  return roundToPrecision(odds);
};

export const calculateFulltimeOdds = (matchConfig: MatchConfigType) => {
  const fullTimeScoreRates = calculateFullTimeScoreRates(matchConfig.firstHalf, matchConfig.secondHalf);
  const { probabilities, overUnderValue, handicapValue, homeOverUnderValue, awayOverUnderValue } =
    calculateProbabilitiesForBetChoices(fullTimeScoreRates);
  const odds = calculateBetOdds(probabilities);

  return { odds, overUnderValue, handicapValue, homeOverUnderValue, awayOverUnderValue };
};

export const calculateHalfOdds = (halfConfig: RateConfig, addingScore = "0-0") => {
  const { probabilities, overUnderValue, handicapValue, homeOverUnderValue, awayOverUnderValue } =
    calculateProbabilitiesForBetChoices(halfConfig.scoreRate, addingScore);

  const odds = calculateBetOdds(probabilities);

  return { odds, overUnderValue, handicapValue, homeOverUnderValue, awayOverUnderValue };
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
    homeOverUnderValue: firstHalf.homeOverUnderValue,
    awayOverUnderValue: firstHalf.awayOverUnderValue,
  };

  const firstHalfOdds = {
    [FirstHalfOddsKey.H1_HDP_HOME]: firstHalf.odds.hdpHome,
    [FirstHalfOddsKey.H1_HDP_AWAY]: firstHalf.odds.hdpAway,
    [FirstHalfOddsKey.H1_1X2_HOME]: firstHalf.odds.home,
    [FirstHalfOddsKey.H1_1X2_AWAY]: firstHalf.odds.away,
    [FirstHalfOddsKey.H1_1X2_DRAW]: firstHalf.odds.draw,
    [FirstHalfOddsKey.H1_OU_OVER]: firstHalf.odds.over,
    [FirstHalfOddsKey.H1_OU_UNDER]: firstHalf.odds.under,
    [FirstHalfOddsKey.H1_OE_ODD]: firstHalf.odds.odd,
    [FirstHalfOddsKey.H1_OE_EVEN]: firstHalf.odds.even,
    [FirstHalfOddsKey.H1_TG_01]: firstHalf.odds.tg01,
    [FirstHalfOddsKey.H1_TG_23]: firstHalf.odds.tg23,
    [FirstHalfOddsKey.H1_TG_4]: firstHalf.odds.tg4,
    [FirstHalfOddsKey.H1_HOME_OVER]: firstHalf.odds.homeOver,
    [FirstHalfOddsKey.H1_HOME_UNDER]: firstHalf.odds.homeUnder,
    [FirstHalfOddsKey.H1_AWAY_OVER]: firstHalf.odds.awayOver,
    [FirstHalfOddsKey.H1_AWAY_UNDER]: firstHalf.odds.awayUnder,

    [FirstHalfOddsKey.FT_HDP_HOME]: fulltime.odds.hdpHome,
    [FirstHalfOddsKey.FT_HDP_AWAY]: fulltime.odds.hdpAway,
    [FirstHalfOddsKey.FT_1X2_HOME]: fulltime.odds.home,
    [FirstHalfOddsKey.FT_1X2_AWAY]: fulltime.odds.away,
    [FirstHalfOddsKey.FT_1X2_DRAW]: fulltime.odds.draw,
    [FirstHalfOddsKey.FT_OU_OVER]: fulltime.odds.over,
    [FirstHalfOddsKey.FT_OU_UNDER]: fulltime.odds.under,
    [FirstHalfOddsKey.FT_OE_ODD]: fulltime.odds.odd,
    [FirstHalfOddsKey.FT_OE_EVEN]: fulltime.odds.even,
    [FirstHalfOddsKey.FT_TG_02]: fulltime.odds.tg02,
    [FirstHalfOddsKey.FT_TG_34]: fulltime.odds.tg34,
    [FirstHalfOddsKey.FT_TG_56]: fulltime.odds.tg56,
    [FirstHalfOddsKey.FT_TG_7]: fulltime.odds.tg7,
    [FirstHalfOddsKey.FT_HOME_OVER]: fulltime.odds.homeOver,
    [FirstHalfOddsKey.FT_HOME_UNDER]: fulltime.odds.homeUnder,
    [FirstHalfOddsKey.FT_AWAY_OVER]: fulltime.odds.awayOver,
    [FirstHalfOddsKey.FT_AWAY_UNDER]: fulltime.odds.awayUnder,
  };

  const addingScore = `${fhHomeGoals}-${fhAwayGoals}`;
  const secondHalf = calculateHalfOdds(matchConfig.secondHalf, addingScore);

  const updatedSecondHalf = {
    ...matchConfig.secondHalf,
    overUnderValue: secondHalf.overUnderValue,
    handicapValue: secondHalf.handicapValue,
    homeOverUnderValue: secondHalf.homeOverUnderValue,
    awayOverUnderValue: secondHalf.awayOverUnderValue,
  };

  const secondHalfOdds = {
    [SecondHalfOddsKey.FT_1X2_HOME]: secondHalf.odds.home,
    [SecondHalfOddsKey.FT_1X2_AWAY]: secondHalf.odds.away,
    [SecondHalfOddsKey.FT_1X2_DRAW]: secondHalf.odds.draw,
    [SecondHalfOddsKey.FT_HDP_HOME]: secondHalf.odds.hdpHome,
    [SecondHalfOddsKey.FT_HDP_AWAY]: secondHalf.odds.hdpAway,
    [SecondHalfOddsKey.FT_OU_OVER]: secondHalf.odds.over,
    [SecondHalfOddsKey.FT_OU_UNDER]: secondHalf.odds.under,
    [SecondHalfOddsKey.FT_OE_ODD]: fhTotalGoals % 2 === 0 ? secondHalf.odds.odd : secondHalf.odds.even,
    [SecondHalfOddsKey.FT_OE_EVEN]: fhTotalGoals % 2 === 0 ? secondHalf.odds.even : secondHalf.odds.odd,
    [SecondHalfOddsKey.FT_TG_02]: secondHalf.odds.tg02,
    [SecondHalfOddsKey.FT_TG_34]: secondHalf.odds.tg34,
    [SecondHalfOddsKey.FT_TG_56]: secondHalf.odds.tg56,
    [SecondHalfOddsKey.FT_TG_7]: secondHalf.odds.tg7,
    [SecondHalfOddsKey.FT_HOME_OVER]: secondHalf.odds.homeOver,
    [SecondHalfOddsKey.FT_HOME_UNDER]: secondHalf.odds.homeUnder,
    [SecondHalfOddsKey.FT_AWAY_OVER]: secondHalf.odds.awayOver,
    [SecondHalfOddsKey.FT_AWAY_UNDER]: secondHalf.odds.awayUnder,
  };

  const updatedMatchConfig = {
    ...matchConfig,
    overUnderValue: fulltime.overUnderValue,
    handicapValue: fulltime.handicapValue,
    homeOverUnderValue: fulltime.homeOverUnderValue,
    awayOverUnderValue: fulltime.awayOverUnderValue,
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

  firstHalfSelections[FirstHalfOddsKey.FT_HDP_HOME].point = fulltime.handicapValue;
  firstHalfSelections[FirstHalfOddsKey.FT_HDP_AWAY].point = -fulltime.handicapValue;

  firstHalfSelections[FirstHalfOddsKey.H1_HDP_HOME].point = firstHalf.handicapValue;
  firstHalfSelections[FirstHalfOddsKey.H1_HDP_AWAY].point = -firstHalf.handicapValue;

  firstHalfSelections[FirstHalfOddsKey.FT_OU_OVER].point = fulltime.overUnderValue;
  firstHalfSelections[FirstHalfOddsKey.FT_OU_UNDER].point = fulltime.overUnderValue;

  firstHalfSelections[FirstHalfOddsKey.H1_OU_OVER].point = firstHalf.overUnderValue;
  firstHalfSelections[FirstHalfOddsKey.H1_OU_UNDER].point = firstHalf.overUnderValue;

  firstHalfSelections[FirstHalfOddsKey.FT_HOME_OVER].point = fulltime.homeOverUnderValue;
  firstHalfSelections[FirstHalfOddsKey.FT_HOME_UNDER].point = fulltime.homeOverUnderValue;

  firstHalfSelections[FirstHalfOddsKey.FT_AWAY_OVER].point = fulltime.awayOverUnderValue;
  firstHalfSelections[FirstHalfOddsKey.FT_AWAY_UNDER].point = fulltime.awayOverUnderValue;

  firstHalfSelections[FirstHalfOddsKey.H1_HOME_OVER].point = firstHalf.homeOverUnderValue;
  firstHalfSelections[FirstHalfOddsKey.H1_HOME_UNDER].point = firstHalf.homeOverUnderValue;

  firstHalfSelections[FirstHalfOddsKey.H1_AWAY_OVER].point = firstHalf.awayOverUnderValue;
  firstHalfSelections[FirstHalfOddsKey.H1_AWAY_UNDER].point = firstHalf.awayOverUnderValue;

  Object.entries(secondHalfOdds).forEach(([key, value]) => {
    const selection: Selection = {
      name: key,
      price: value,
      point: 0,
      settlementStatus: SettlementStatus.PLAY,
    };

    secondHalfSelections[key] = selection;
  });

  secondHalfSelections[SecondHalfOddsKey.FT_HDP_HOME].point = secondHalf.handicapValue;
  secondHalfSelections[SecondHalfOddsKey.FT_HDP_AWAY].point = -secondHalf.handicapValue;

  secondHalfSelections[SecondHalfOddsKey.FT_OU_OVER].point = secondHalf.overUnderValue + fhTotalGoals;
  secondHalfSelections[SecondHalfOddsKey.FT_OU_UNDER].point = secondHalf.overUnderValue + fhTotalGoals;

  secondHalfSelections[SecondHalfOddsKey.FT_HOME_OVER].point = secondHalf.homeOverUnderValue + fhHomeGoals;
  secondHalfSelections[SecondHalfOddsKey.FT_HOME_UNDER].point = secondHalf.homeOverUnderValue + fhHomeGoals;

  secondHalfSelections[SecondHalfOddsKey.FT_AWAY_OVER].point = secondHalf.awayOverUnderValue + fhAwayGoals;
  secondHalfSelections[SecondHalfOddsKey.FT_AWAY_UNDER].point = secondHalf.awayOverUnderValue + fhAwayGoals;

  return {
    odds: [firstHalfOdds, secondHalfOdds],
    matchConfig: updatedMatchConfig,
    selections: [firstHalfSelections, secondHalfSelections],
  };
};
