import {
  RateConfig,
  MatchConfigType,
  SettlementStatus,
  Selection,
  FirstHalfOddsKey,
  SecondHalfOddsKey,
  RoundResultType,
} from "../types";
import { combineResults } from "./result-helper";

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

type OddsCalculationResult = {
  odds: Record<string, number>;
  overUnderValue: number;
  handicapValue: number;
  homeOverUnderValue: number;
  awayOverUnderValue: number;
};

export const parseScore = (score: string): [number, number] => {
  const [home, away] = score.split("-").map(Number);
  return [home, away];
};

export const roundToPrecision = (value: number, precision = 100) => {
  return Math.floor(value * precision) / precision;
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

export const calculateOddsFromRate = (rateConfig: RateConfig, addingScore = "0-0"): OddsCalculationResult => {
  const { probabilities, overUnderValue, handicapValue, homeOverUnderValue, awayOverUnderValue } =
    calculateProbabilitiesForBetChoices(rateConfig.scoreRate, addingScore);

  const odds = calculateBetOdds(probabilities);

  return { odds, overUnderValue, handicapValue, homeOverUnderValue, awayOverUnderValue };
};

export const calculateOddsForRound = (matchConfig: MatchConfigType, result: RoundResultType) => {
  const matchConfigs = {
    firstHalfMatchConfigs: [] as MatchConfigType[],
    secondHalfMatchConfigs: [] as MatchConfigType[],
  };

  const odds = {
    firstHalfOdds: [] as Record<string, number>[],
    secondHalfOdds: [] as Record<string, number>[],
  };

  const selections = {
    firstHalfSelections: [] as Record<string, Selection>[],
    secondHalfSelections: [] as Record<string, Selection>[],
  };

  for (let i = 0; i < matchConfig.firstHalf.numberOfEventDetails; i++) {
    const currentMatchConfig = { ...matchConfig };
    const currentFirstHalfScoreRates = mergeArrayOfRates(matchConfig.firstHalf.eventDetailScoreRates.slice(i));
    const currentResult = combineResults(result.firstHalfResults.slice(0, i));
    currentMatchConfig.firstHalf.scoreRate = currentFirstHalfScoreRates.scoreRate;
    const { firstHalfOdds, firstHalfSelections, updatedFirstHalf, fulltime } = calculateOddsForFirstHalf(
      currentMatchConfig,
      currentResult.finalScore
    );

    const updatedMatchConfig = {
      ...currentMatchConfig,
      overUnderValue: fulltime.overUnderValue,
      handicapValue: fulltime.handicapValue,
      homeOverUnderValue: fulltime.homeOverUnderValue,
      awayOverUnderValue: fulltime.awayOverUnderValue,
      firstHalf: updatedFirstHalf,
    };

    matchConfigs.firstHalfMatchConfigs.push(updatedMatchConfig);
    odds.firstHalfOdds.push(firstHalfOdds);
    selections.firstHalfSelections.push(firstHalfSelections);
  }

  for (let i = 0; i < matchConfig.secondHalf.numberOfEventDetails; i++) {
    const currentMatchConfig = { ...matchConfig };
    const currentSecondHalfScoreRates = mergeArrayOfRates(matchConfig.secondHalf.eventDetailScoreRates.slice(i));
    const currentResult = combineResults(result.firstHalfResults.concat(result.secondHalfResults.slice(0, i)));
    currentMatchConfig.secondHalf.scoreRate = currentSecondHalfScoreRates.scoreRate;
    const { secondHalfOdds, secondHalfSelections, updatedSecondHalf } = calculateOddsForSecondHalf(
      currentMatchConfig,
      currentResult.finalScore
    );

    const updatedMatchConfig = {
      ...currentMatchConfig,
      overUnderValue: updatedSecondHalf.overUnderValue,
      handicapValue: updatedSecondHalf.handicapValue,
      homeOverUnderValue: updatedSecondHalf.homeOverUnderValue,
      awayOverUnderValue: updatedSecondHalf.awayOverUnderValue,
    };

    matchConfigs.secondHalfMatchConfigs.push(updatedMatchConfig);
    odds.secondHalfOdds.push(secondHalfOdds);
    selections.secondHalfSelections.push(secondHalfSelections);
  }

  return {
    odds,
    matchConfigs,
    selections,
  };
};

export const calculateOddsForFirstHalf = (matchConfig: MatchConfigType, addingScore: string) => {
  const fullTimeScoreRates = mergeTwoScoreRates(matchConfig.firstHalf, matchConfig.secondHalf);
  const fulltime = calculateOddsFromRate(fullTimeScoreRates, addingScore);
  const firstHalf = calculateOddsFromRate(matchConfig.firstHalf, addingScore);

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
    [FirstHalfOddsKey.FT_HOME_OVER]: fulltime.odds.homeOver,
    [FirstHalfOddsKey.FT_HOME_UNDER]: fulltime.odds.homeUnder,
    [FirstHalfOddsKey.FT_AWAY_OVER]: fulltime.odds.awayOver,
    [FirstHalfOddsKey.FT_AWAY_UNDER]: fulltime.odds.awayUnder,
  };

  const firstHalfSelections: Record<string, Selection> = {};

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

  return {
    fulltime,
    firstHalfOdds,
    firstHalfSelections,
    updatedFirstHalf,
  };
};

export const calculateOddsForSecondHalf = (matchConfig: MatchConfigType, addingScore: string) => {
  const [addingHomeGoals, addingAwayGoals] = parseScore(addingScore);
  const addingTotalGoals = addingHomeGoals + addingAwayGoals;

  const secondHalf = calculateOddsFromRate(matchConfig.secondHalf, addingScore);

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
    [SecondHalfOddsKey.FT_OE_ODD]: addingTotalGoals % 2 === 0 ? secondHalf.odds.odd : secondHalf.odds.even,
    [SecondHalfOddsKey.FT_OE_EVEN]: addingTotalGoals % 2 === 0 ? secondHalf.odds.even : secondHalf.odds.odd,
    [SecondHalfOddsKey.FT_HOME_OVER]: secondHalf.odds.homeOver,
    [SecondHalfOddsKey.FT_HOME_UNDER]: secondHalf.odds.homeUnder,
    [SecondHalfOddsKey.FT_AWAY_OVER]: secondHalf.odds.awayOver,
    [SecondHalfOddsKey.FT_AWAY_UNDER]: secondHalf.odds.awayUnder,
  };

  const secondHalfSelections: Record<string, Selection> = {};

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

  secondHalfSelections[SecondHalfOddsKey.FT_OU_OVER].point = secondHalf.overUnderValue + addingTotalGoals;
  secondHalfSelections[SecondHalfOddsKey.FT_OU_UNDER].point = secondHalf.overUnderValue + addingTotalGoals;

  secondHalfSelections[SecondHalfOddsKey.FT_HOME_OVER].point = secondHalf.homeOverUnderValue + addingHomeGoals;
  secondHalfSelections[SecondHalfOddsKey.FT_HOME_UNDER].point = secondHalf.homeOverUnderValue + addingHomeGoals;

  secondHalfSelections[SecondHalfOddsKey.FT_AWAY_OVER].point = secondHalf.awayOverUnderValue + addingAwayGoals;
  secondHalfSelections[SecondHalfOddsKey.FT_AWAY_UNDER].point = secondHalf.awayOverUnderValue + addingAwayGoals;

  return {
    secondHalfOdds,
    secondHalfSelections,
    updatedSecondHalf,
  };
};
