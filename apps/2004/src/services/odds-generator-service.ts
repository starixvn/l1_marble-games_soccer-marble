import {
  OddsGeneratorService as BaseOddsGeneratorService,
  oddsHelper,
  resultHelper,
  SecondHalfOddsKey,
  FirstHalfOddsKey,
  SettlementStatus,
} from "@soccer-marble/soccer-marble-base";
import type { RoundResultType, Selection, MatchConfigType } from "@soccer-marble/soccer-marble-base";
import type { HalfConfigType } from "../types";

export class OddsGeneratorService extends BaseOddsGeneratorService {
  override calculateOddsForRound = (matchConfig: MatchConfigType, result: RoundResultType) => {
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

    for (let i = 0; i < (matchConfig.firstHalf as HalfConfigType).numberOfEventDetails; i++) {
      const currentMatchConfig = { ...matchConfig };
      const currentFirstHalfScoreRates = oddsHelper.mergeArrayOfRates(
        (matchConfig.firstHalf as HalfConfigType).eventDetailScoreRates.slice(i)
      );
      const currentResult = resultHelper.combineResults((result as any).firstHalfResults.slice(0, i));
      currentMatchConfig.firstHalf.scoreRate = currentFirstHalfScoreRates.scoreRate;
      const { firstHalfOdds, firstHalfSelections, updatedFirstHalf, fulltime } = this.calculateOddsForFirstHalf(
        currentMatchConfig,
        currentResult.finalScore
      );

      const updatedMatchConfig = {
        overUnderValue: fulltime.overUnderValue,
        handicapValue: fulltime.handicapValue,
        homeOverUnderValue: fulltime.homeOverUnderValue,
        awayOverUnderValue: fulltime.awayOverUnderValue,
        firstHalf: {
          ...updatedFirstHalf,
          scoreRate: currentFirstHalfScoreRates.scoreRate,
          eventDetailScoreRates: null,
        },
      };

      matchConfigs.firstHalfMatchConfigs.push(updatedMatchConfig as any);
      odds.firstHalfOdds.push(firstHalfOdds);
      selections.firstHalfSelections.push(firstHalfSelections);
    }

    for (let i = 0; i < (matchConfig.secondHalf as HalfConfigType).numberOfEventDetails; i++) {
      const currentMatchConfig = { ...matchConfig };
      const currentSecondHalfScoreRates = oddsHelper.mergeArrayOfRates(
        (matchConfig.secondHalf as HalfConfigType).eventDetailScoreRates.slice(i)
      );
      const currentResult = resultHelper.combineResults(
        (result as any).firstHalfResults.concat((result as any).secondHalfResults.slice(0, i))
      );
      currentMatchConfig.secondHalf.scoreRate = currentSecondHalfScoreRates.scoreRate;
      const { secondHalfOdds, secondHalfSelections, updatedSecondHalf } = this.calculateOddsForSecondHalf(
        currentMatchConfig,
        currentResult.finalScore
      );

      const updatedMatchConfig = {
        overUnderValue: updatedSecondHalf.overUnderValue,
        handicapValue: updatedSecondHalf.handicapValue,
        homeOverUnderValue: updatedSecondHalf.homeOverUnderValue,
        awayOverUnderValue: updatedSecondHalf.awayOverUnderValue,
        secondHalf: {
          ...updatedSecondHalf,
          scoreRate: currentSecondHalfScoreRates.scoreRate,
          eventDetailScoreRates: null,
        },
      };

      matchConfigs.secondHalfMatchConfigs.push(updatedMatchConfig as any);
      odds.secondHalfOdds.push(secondHalfOdds);
      selections.secondHalfSelections.push(secondHalfSelections);
    }

    return {
      odds: [...odds.firstHalfOdds, ...odds.secondHalfOdds] as any,
      matchConfigs: matchConfigs as any,
      selections: [...selections.firstHalfSelections, ...selections.secondHalfSelections] as any,
    } as any;
  };

  calculateOddsForFirstHalf = (matchConfig: MatchConfigType, addingScore: string) => {
    const [addingHomeGoals, addingAwayGoals] = oddsHelper.parseScore(addingScore);
    const addingTotalGoals = addingHomeGoals + addingAwayGoals;

    const fullTimeScoreRates = oddsHelper.mergeTwoScoreRates(matchConfig.firstHalf, matchConfig.secondHalf);
    const fulltime = this.calculateOddsFromRate(fullTimeScoreRates, addingScore);
    const firstHalf = this.calculateOddsFromRate(matchConfig.firstHalf, addingScore);

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
      [FirstHalfOddsKey.H1_OE_ODD]: addingTotalGoals % 2 === 0 ? firstHalf.odds.odd : firstHalf.odds.even,
      [FirstHalfOddsKey.H1_OE_EVEN]: addingTotalGoals % 2 === 0 ? firstHalf.odds.even : firstHalf.odds.odd,
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
      [FirstHalfOddsKey.FT_OE_ODD]: addingTotalGoals % 2 === 0 ? fulltime.odds.odd : fulltime.odds.even,
      [FirstHalfOddsKey.FT_OE_EVEN]: addingTotalGoals % 2 === 0 ? fulltime.odds.even : fulltime.odds.odd,
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

    firstHalfSelections[FirstHalfOddsKey.FT_OU_OVER].point = fulltime.overUnderValue + addingTotalGoals;
    firstHalfSelections[FirstHalfOddsKey.FT_OU_UNDER].point = fulltime.overUnderValue + addingTotalGoals;

    firstHalfSelections[FirstHalfOddsKey.H1_OU_OVER].point = firstHalf.overUnderValue + addingTotalGoals;
    firstHalfSelections[FirstHalfOddsKey.H1_OU_UNDER].point = firstHalf.overUnderValue + addingTotalGoals;

    firstHalfSelections[FirstHalfOddsKey.FT_HOME_OVER].point = fulltime.homeOverUnderValue + addingHomeGoals;
    firstHalfSelections[FirstHalfOddsKey.FT_HOME_UNDER].point = fulltime.homeOverUnderValue + addingHomeGoals;

    firstHalfSelections[FirstHalfOddsKey.FT_AWAY_OVER].point = fulltime.awayOverUnderValue + addingAwayGoals;
    firstHalfSelections[FirstHalfOddsKey.FT_AWAY_UNDER].point = fulltime.awayOverUnderValue + addingAwayGoals;

    firstHalfSelections[FirstHalfOddsKey.H1_HOME_OVER].point = firstHalf.homeOverUnderValue + addingHomeGoals;
    firstHalfSelections[FirstHalfOddsKey.H1_HOME_UNDER].point = firstHalf.homeOverUnderValue + addingHomeGoals;

    firstHalfSelections[FirstHalfOddsKey.H1_AWAY_OVER].point = firstHalf.awayOverUnderValue + addingAwayGoals;
    firstHalfSelections[FirstHalfOddsKey.H1_AWAY_UNDER].point = firstHalf.awayOverUnderValue + addingAwayGoals;

    return {
      fulltime,
      firstHalfOdds,
      firstHalfSelections,
      updatedFirstHalf,
    };
  };

  calculateOddsForSecondHalf = (matchConfig: MatchConfigType, addingScore: string) => {
    const [addingHomeGoals, addingAwayGoals] = oddsHelper.parseScore(addingScore);
    const addingTotalGoals = addingHomeGoals + addingAwayGoals;

    const secondHalf = this.calculateOddsFromRate(matchConfig.secondHalf, addingScore);

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
}
