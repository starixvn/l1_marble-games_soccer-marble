import { RateConfig, MatchConfigType, SettlementStatus, Selection, FirstHalfOddsKey, SecondHalfOddsKey } from "../types";

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

export const calculateProbabilitiesForBetChoices = (scoreRates: Record<string, number>, addingScore = "0-0") => {
  const totalRates = Object.values(scoreRates).reduce((sum, rate) => sum + rate, 0);
  const [addingHome, addingAway] = parseScore(addingScore);

  let hdpHome = 0,
    hdpAway = 0,
    hdpDraw = 0,
    home = 0,
    away = 0,
    draw = 0,
    over = 0,
    under = 0,
    odd = 0,
    even = 0,
    tg02 = 0,
    tg34 = 0,
    tg56 = 0,
    tg7 = 0,
    tg01 = 0,
    tg23 = 0,
    tg4 = 0;

  const { homeScore, awayScore } = calculateAverageScore(scoreRates);
  const handicapValue = calculateHandicapValue(homeScore, awayScore);
  const overUnderValue = calculateOverUnderValue(homeScore, awayScore);

  for (const [score, rate] of Object.entries(scoreRates)) {
    const [homeGoals, awayGoals] = parseScore(score);
    const totalGoals = homeGoals + awayGoals;
    const totalGoalsWithAdding = totalGoals + addingHome + addingAway;

    if (homeGoals + addingHome > awayGoals + addingAway) {
      home += rate;
    } else if (homeGoals + addingHome < awayGoals + addingAway) {
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

    switch (totalGoalsWithAdding) {
      case 0:
      case 1:
        tg01 += rate;
        tg02 += rate;
        break;
      case 2:
        tg02 += rate;
        tg23 += rate;
        break;
      case 3:
        tg34 += rate;
        tg23 += rate;
        break;
      case 4:
        tg4 += rate;
        tg34 += rate;
        break;
      case 5:
      case 6:
        tg56 += rate;
        break;
      default: // 7 or more
        tg7 += rate;
        break;
    }
  }

  const hdpDrawRate = hdpDraw / totalRates;

  return {
    probabilities: {
      hdp_home: hdpHome / totalRates / (1 - hdpDrawRate),
      hdp_away: hdpAway / totalRates / (1 - hdpDrawRate),
      home: home / totalRates,
      away: away / totalRates,
      draw: draw / totalRates,
      over: over / totalRates,
      under: under / totalRates,
      even: even / totalRates,
      odd: odd / totalRates,
      tg01: tg01 / totalRates,
      tg02: tg02 / totalRates,
      tg23: tg23 / totalRates,
      tg34: tg34 / totalRates,
      tg4: tg4 / totalRates,
      tg56: tg56 / totalRates,
      tg7: tg7 / totalRates,
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
  if (prob <= 0 || prob >= 1) {
    return 0;
  }

  const odds = 1 / prob;
  return roundToPrecision(odds);
};

export const calculateFulltimeOdds = (matchConfig: MatchConfigType) => {
  const fullTimeScoreRates = calculateFullTimeScoreRates(matchConfig.firstHalf, matchConfig.secondHalf);
  const { probabilities, overUnderValue, handicapValue } = calculateProbabilitiesForBetChoices(fullTimeScoreRates);
  const odds = calculateBetOdds(probabilities);

  return { odds, overUnderValue, handicapValue };
};

export const calculateHalfOdds = (halfConfig: RateConfig, addingScore = "0-0") => {
  const { probabilities, overUnderValue, handicapValue } = calculateProbabilitiesForBetChoices(
    halfConfig.scoreRate,
    addingScore
  );

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
    [FirstHalfOddsKey.H1_HDP_HOME]: firstHalf.odds.hdp_home,
    [FirstHalfOddsKey.H1_HDP_AWAY]: firstHalf.odds.hdp_away,
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

    [FirstHalfOddsKey.FT_HDP_HOME]: fulltime.odds.hdp_home,
    [FirstHalfOddsKey.FT_HDP_AWAY]: fulltime.odds.hdp_away,
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
  };

  const addingScore = `${fhHomeGoals}-${fhAwayGoals}`;
  const secondHalf = calculateHalfOdds(matchConfig.secondHalf, addingScore);

  const updatedSecondHalf = {
    ...matchConfig.secondHalf,
    overUnderValue: secondHalf.overUnderValue,
    handicapValue: secondHalf.handicapValue,
  };

  const secondHalfOdds = {
    [SecondHalfOddsKey.FT_1X2_HOME]: secondHalf.odds.home,
    [SecondHalfOddsKey.FT_1X2_AWAY]: secondHalf.odds.away,
    [SecondHalfOddsKey.FT_1X2_DRAW]: secondHalf.odds.draw,
    [SecondHalfOddsKey.FT_HDP_HOME]: secondHalf.odds.hdp_home,
    [SecondHalfOddsKey.FT_HDP_AWAY]: secondHalf.odds.hdp_away,
    [SecondHalfOddsKey.FT_OU_OVER]: secondHalf.odds.over,
    [SecondHalfOddsKey.FT_OU_UNDER]: secondHalf.odds.under,
    [SecondHalfOddsKey.FT_OE_ODD]: fhTotalGoals % 2 === 0 ? secondHalf.odds.odd : secondHalf.odds.even,
    [SecondHalfOddsKey.FT_OE_EVEN]: fhTotalGoals % 2 === 0 ? secondHalf.odds.even : secondHalf.odds.odd,
    [SecondHalfOddsKey.FT_TG_02]: secondHalf.odds.tg02,
    [SecondHalfOddsKey.FT_TG_34]: secondHalf.odds.tg34,
    [SecondHalfOddsKey.FT_TG_56]: secondHalf.odds.tg56,
    [SecondHalfOddsKey.FT_TG_7]: secondHalf.odds.tg7,
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

  firstHalfSelections[FirstHalfOddsKey.FT_HDP_HOME].point = fulltime.handicapValue;
  firstHalfSelections[FirstHalfOddsKey.FT_HDP_AWAY].point = -fulltime.handicapValue;
  firstHalfSelections[FirstHalfOddsKey.H1_HDP_HOME].point = firstHalf.handicapValue;
  firstHalfSelections[FirstHalfOddsKey.H1_HDP_AWAY].point = -firstHalf.handicapValue;
  firstHalfSelections[FirstHalfOddsKey.FT_OU_OVER].point = fulltime.overUnderValue;
  firstHalfSelections[FirstHalfOddsKey.FT_OU_UNDER].point = fulltime.overUnderValue;
  firstHalfSelections[FirstHalfOddsKey.H1_OU_OVER].point = firstHalf.overUnderValue;
  firstHalfSelections[FirstHalfOddsKey.H1_OU_UNDER].point = firstHalf.overUnderValue;

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

  return {
    odds: [firstHalfOdds, secondHalfOdds],
    matchConfig: updatedMatchConfig,
    selections: [firstHalfSelections, secondHalfSelections],
  };
};
