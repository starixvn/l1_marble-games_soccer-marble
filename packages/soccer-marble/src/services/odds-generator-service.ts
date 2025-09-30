import {
  RateConfig,
  MatchConfig,
  SettlementStatus,
  Selection,
  FirstHalfOddsKey,
  SecondHalfOddsKey,
  BetChoices,
  RoundResult,
} from "../types";
import { oddsHelper } from "../helpers";

export class OddsGeneratorService {
  update1X2 = (counters: Record<BetChoices, number>, home: number, away: number, rate: number) => {
    if (home > away) {
      counters.home += rate;
    } else if (home < away) {
      counters.away += rate;
    } else {
      counters.draw += rate;
    }
  };

  updateHandicap = (
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

  updateOverUnder = (
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

  updateEvenOdd = (counters: Record<BetChoices, number>, totalGoals: number, rate: number) => {
    if (totalGoals % 2 === 0) {
      counters.even += rate;
    } else {
      counters.odd += rate;
    }
  };

  updateTeamOverUnder = (
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

  calculateOddsInfo = (scoreRates: Record<string, number>) => {
    const { homeScore, awayScore } = oddsHelper.calculateAverageScore(scoreRates);
    const handicapValue = this.calculateHandicapValue(homeScore, awayScore);
    const overUnderValue = this.calculateOverUnderValue(homeScore, awayScore);
    const homeOverUnderValue = this.calculateOverUnderValue(homeScore, 0);
    const awayOverUnderValue = this.calculateOverUnderValue(0, awayScore);

    return {
      handicapValue,
      overUnderValue,
      homeOverUnderValue,
      awayOverUnderValue,
    };
  };

  calculateProbabilitiesForBetChoices = (scoreRates: Record<string, number>, addingScore = "0-0") => {
    const totalRates = Object.values(scoreRates).reduce((sum, rate) => sum + rate, 0);
    const [addingHome, addingAway] = oddsHelper.parseScore(addingScore);
    const { handicapValue, overUnderValue, homeOverUnderValue, awayOverUnderValue } =
      this.calculateOddsInfo(scoreRates);

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
      const [homeGoals, awayGoals] = oddsHelper.parseScore(score);
      const totalGoals = homeGoals + awayGoals;
      const addedHome = homeGoals + addingHome;
      const addedAway = awayGoals + addingAway;
      const totalGoalsWithAdding = totalGoals + addingHome + addingAway;

      this.update1X2(counters, addedHome, addedAway, rate);

      this.updateHandicap(counters, homeGoals, awayGoals, handicapValue, rate);

      this.updateOverUnder(counters, totalGoals, overUnderValue, rate);

      this.updateEvenOdd(counters, totalGoalsWithAdding, rate);

      this.updateTeamOverUnder(counters, homeGoals, awayGoals, homeOverUnderValue, awayOverUnderValue, rate);
    }

    return Object.keys(counters).reduce((result, key) => {
      result[key as BetChoices] = counters[key as BetChoices] / totalRates;
      return result;
    }, {} as Record<BetChoices, number>);
  };

  calculateHandicapValue = (homeScore: number, awayScore: number) => {
    return Math.floor(awayScore - homeScore) + 0.5;
  };

  calculateOverUnderValue = (homeScore: number, awayScore: number) => {
    return Math.floor(homeScore + awayScore) + 0.5;
  };

  calculateBetOdds = (probabilities: Record<string, number>): Record<string, number> => {
    return Object.keys(probabilities).reduce((result, betChoice) => {
      const prob = probabilities[betChoice];
      result[betChoice] = oddsHelper.probabilityToBetRawOdds(prob);
      return result;
    }, {} as Record<string, number>);
  };

  calculateOddsFromRate = (rateConfig: RateConfig, addingScore = "0-0") => {
    const probabilities = this.calculateProbabilitiesForBetChoices(rateConfig.scoreRate, addingScore);

    return this.calculateBetOdds(probabilities);
  };

  calculateOddsForFirstHalf = (matchConfig: MatchConfig) => {
    const fulltimeOdds = this.calculateOddsFromRate(matchConfig.rateConfig);
    const firstHalfOdds = this.calculateOddsFromRate(matchConfig.eventDetailInfos[0].rateConfig);

    return {
      [FirstHalfOddsKey.H1_HDP_HOME]: firstHalfOdds.hdpHome,
      [FirstHalfOddsKey.H1_HDP_AWAY]: firstHalfOdds.hdpAway,
      [FirstHalfOddsKey.H1_1X2_HOME]: firstHalfOdds.home,
      [FirstHalfOddsKey.H1_1X2_AWAY]: firstHalfOdds.away,
      [FirstHalfOddsKey.H1_1X2_DRAW]: firstHalfOdds.draw,
      [FirstHalfOddsKey.H1_OU_OVER]: firstHalfOdds.over,
      [FirstHalfOddsKey.H1_OU_UNDER]: firstHalfOdds.under,
      [FirstHalfOddsKey.H1_OE_ODD]: firstHalfOdds.odd,
      [FirstHalfOddsKey.H1_OE_EVEN]: firstHalfOdds.even,
      [FirstHalfOddsKey.H1_HOME_OVER]: firstHalfOdds.homeOver,
      [FirstHalfOddsKey.H1_HOME_UNDER]: firstHalfOdds.homeUnder,
      [FirstHalfOddsKey.H1_AWAY_OVER]: firstHalfOdds.awayOver,
      [FirstHalfOddsKey.H1_AWAY_UNDER]: firstHalfOdds.awayUnder,

      [FirstHalfOddsKey.FT_HDP_HOME]: fulltimeOdds.hdpHome,
      [FirstHalfOddsKey.FT_HDP_AWAY]: fulltimeOdds.hdpAway,
      [FirstHalfOddsKey.FT_1X2_HOME]: fulltimeOdds.home,
      [FirstHalfOddsKey.FT_1X2_AWAY]: fulltimeOdds.away,
      [FirstHalfOddsKey.FT_1X2_DRAW]: fulltimeOdds.draw,
      [FirstHalfOddsKey.FT_OU_OVER]: fulltimeOdds.over,
      [FirstHalfOddsKey.FT_OU_UNDER]: fulltimeOdds.under,
      [FirstHalfOddsKey.FT_OE_ODD]: fulltimeOdds.odd,
      [FirstHalfOddsKey.FT_OE_EVEN]: fulltimeOdds.even,
      [FirstHalfOddsKey.FT_HOME_OVER]: fulltimeOdds.homeOver,
      [FirstHalfOddsKey.FT_HOME_UNDER]: fulltimeOdds.homeUnder,
      [FirstHalfOddsKey.FT_AWAY_OVER]: fulltimeOdds.awayOver,
      [FirstHalfOddsKey.FT_AWAY_UNDER]: fulltimeOdds.awayUnder,
    };
  };

  calculateOddsForSecondHalf = (matchConfig: MatchConfig, result: RoundResult) => {
    const firstHalfResult = result[0].result.goalSequence;
    const fhHomeGoals = firstHalfResult.split("H").length - 1;
    const fhAwayGoals = firstHalfResult.split("A").length - 1;
    const addingScore = `${fhHomeGoals}-${fhAwayGoals}`;
    const secondHalfOdds = this.calculateOddsFromRate(matchConfig.eventDetailInfos[1].rateConfig, addingScore);

    return {
      [SecondHalfOddsKey.FT_1X2_HOME]: secondHalfOdds.home,
      [SecondHalfOddsKey.FT_1X2_AWAY]: secondHalfOdds.away,
      [SecondHalfOddsKey.FT_1X2_DRAW]: secondHalfOdds.draw,
      [SecondHalfOddsKey.FT_HDP_HOME]: secondHalfOdds.hdpHome,
      [SecondHalfOddsKey.FT_HDP_AWAY]: secondHalfOdds.hdpAway,
      [SecondHalfOddsKey.FT_OU_OVER]: secondHalfOdds.over,
      [SecondHalfOddsKey.FT_OU_UNDER]: secondHalfOdds.under,
      [SecondHalfOddsKey.FT_OE_ODD]: secondHalfOdds.odd,
      [SecondHalfOddsKey.FT_OE_EVEN]: secondHalfOdds.even,
      [SecondHalfOddsKey.FT_HOME_OVER]: secondHalfOdds.homeOver,
      [SecondHalfOddsKey.FT_HOME_UNDER]: secondHalfOdds.homeUnder,
      [SecondHalfOddsKey.FT_AWAY_OVER]: secondHalfOdds.awayOver,
      [SecondHalfOddsKey.FT_AWAY_UNDER]: secondHalfOdds.awayUnder,
    };
  };

  generateFirstHalfSelections = (allFirstHalfOdds: Record<string, number>, matchConfig: MatchConfig) => {
    const firstHalfSelections: Record<string, Selection> = {};
    const firstHalfOddsInfo = matchConfig.eventDetailInfos[0].oddsInfo;
    const fulltimeOddsInfo = matchConfig.oddsInfo;

    Object.entries(allFirstHalfOdds).forEach(([key, value]) => {
      const selection: Selection = {
        name: key,
        price: value,
        point: 0,
        settlementStatus: SettlementStatus.PLAY,
      };

      firstHalfSelections[key] = selection;
    });

    firstHalfSelections[FirstHalfOddsKey.FT_HDP_HOME].point = fulltimeOddsInfo.handicapValue;
    firstHalfSelections[FirstHalfOddsKey.FT_HDP_AWAY].point = -fulltimeOddsInfo.handicapValue;

    firstHalfSelections[FirstHalfOddsKey.H1_HDP_HOME].point = firstHalfOddsInfo.handicapValue;
    firstHalfSelections[FirstHalfOddsKey.H1_HDP_AWAY].point = -firstHalfOddsInfo.handicapValue;

    firstHalfSelections[FirstHalfOddsKey.FT_OU_OVER].point = fulltimeOddsInfo.overUnderValue;
    firstHalfSelections[FirstHalfOddsKey.FT_OU_UNDER].point = fulltimeOddsInfo.overUnderValue;

    firstHalfSelections[FirstHalfOddsKey.H1_OU_OVER].point = firstHalfOddsInfo.overUnderValue;
    firstHalfSelections[FirstHalfOddsKey.H1_OU_UNDER].point = firstHalfOddsInfo.overUnderValue;

    firstHalfSelections[FirstHalfOddsKey.FT_HOME_OVER].point = fulltimeOddsInfo.homeOverUnderValue;
    firstHalfSelections[FirstHalfOddsKey.FT_HOME_UNDER].point = fulltimeOddsInfo.homeOverUnderValue;

    firstHalfSelections[FirstHalfOddsKey.FT_AWAY_OVER].point = fulltimeOddsInfo.awayOverUnderValue;
    firstHalfSelections[FirstHalfOddsKey.FT_AWAY_UNDER].point = fulltimeOddsInfo.awayOverUnderValue;

    firstHalfSelections[FirstHalfOddsKey.H1_HOME_OVER].point = firstHalfOddsInfo.homeOverUnderValue;
    firstHalfSelections[FirstHalfOddsKey.H1_HOME_UNDER].point = firstHalfOddsInfo.homeOverUnderValue;

    firstHalfSelections[FirstHalfOddsKey.H1_AWAY_OVER].point = firstHalfOddsInfo.awayOverUnderValue;
    firstHalfSelections[FirstHalfOddsKey.H1_AWAY_UNDER].point = firstHalfOddsInfo.awayOverUnderValue;

    return firstHalfSelections;
  };

  generateSecondHalfSelections = (
    allSecondHalfOdds: Record<string, number>,
    matchConfig: MatchConfig,
    result: RoundResult
  ) => {
    const secondHalfSelections: Record<string, Selection> = {};
    const firstHalfResult = result[0].result.goalSequence;
    const fhHomeGoals = firstHalfResult.split("H").length - 1;
    const fhAwayGoals = firstHalfResult.split("A").length - 1;
    const fhTotalGoals = fhHomeGoals + fhAwayGoals;
    const secondHalfOddsInfo = matchConfig.eventDetailInfos[1].oddsInfo;

    Object.entries(allSecondHalfOdds).forEach(([key, value]) => {
      const selection: Selection = {
        name: key,
        price: value,
        point: 0,
        settlementStatus: SettlementStatus.PLAY,
      };

      secondHalfSelections[key] = selection;
    });

    secondHalfSelections[SecondHalfOddsKey.FT_HDP_HOME].point = secondHalfOddsInfo.handicapValue;
    secondHalfSelections[SecondHalfOddsKey.FT_HDP_AWAY].point = -secondHalfOddsInfo.handicapValue;

    secondHalfSelections[SecondHalfOddsKey.FT_OU_OVER].point = secondHalfOddsInfo.overUnderValue + fhTotalGoals;
    secondHalfSelections[SecondHalfOddsKey.FT_OU_UNDER].point = secondHalfOddsInfo.overUnderValue + fhTotalGoals;

    secondHalfSelections[SecondHalfOddsKey.FT_HOME_OVER].point = secondHalfOddsInfo.homeOverUnderValue + fhHomeGoals;
    secondHalfSelections[SecondHalfOddsKey.FT_HOME_UNDER].point = secondHalfOddsInfo.homeOverUnderValue + fhHomeGoals;

    secondHalfSelections[SecondHalfOddsKey.FT_AWAY_OVER].point = secondHalfOddsInfo.awayOverUnderValue + fhAwayGoals;
    secondHalfSelections[SecondHalfOddsKey.FT_AWAY_UNDER].point = secondHalfOddsInfo.awayOverUnderValue + fhAwayGoals;

    return secondHalfSelections;
  };

  calculateOddsForRound = (matchConfig: MatchConfig, result: RoundResult): Record<string, number>[] => {
    const allFirstHalfOdds = this.calculateOddsForFirstHalf(matchConfig);
    const allSecondHalfOdds = this.calculateOddsForSecondHalf(matchConfig, result);

    return [allFirstHalfOdds, allSecondHalfOdds];
  };

  generateSelectionsForRound = (odds: Record<string, number>[], matchConfig: MatchConfig, result: RoundResult) => {
    const firstHalfSelections = this.generateFirstHalfSelections(odds[0], matchConfig);
    const secondHalfSelections = this.generateSecondHalfSelections(odds[1], matchConfig, result);

    return [firstHalfSelections, secondHalfSelections];
  };
}
