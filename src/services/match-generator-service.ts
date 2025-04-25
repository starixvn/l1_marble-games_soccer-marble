import { RoundSettlementResultType, SettlementStatus, RoundResultType, MatchConfigType } from "../types";
import { securePickOne, secureShuffle } from "sc-core-rng";
import { GameSettings, RateConfig, AppContainer } from "../types";
import { calculateOddsForRound } from "../helpers/odds-helper";
import { generateResult, getSettlementResult } from "../helpers/result-helper";

// Match Manager class to handle match-related operations
export class MatchGeneratorService {
  private gameSettings: GameSettings;
  private rateConfigs: RateConfig[];

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.rateConfigs = container.rateConfigs;
  }

  createNewMatch(): { homeTeam: string; awayTeam: string } {
    const teams = secureShuffle(this.gameSettings.teams);
    return {
      homeTeam: teams[0],
      awayTeam: teams[1],
    };
  }

  createNewMatchConfig(): MatchConfigType {
    return {
      firstHalf: securePickOne(this.rateConfigs),
      secondHalf: securePickOne(this.rateConfigs),
    };
  }

  generateRoundOddsAndUpdateMatchConfig(matchConfig: MatchConfigType) {
    return calculateOddsForRound(matchConfig);
  }

  generateResult(matchConfig: MatchConfigType, numberOfVideos: Record<string, number>) {
    return generateResult({
      numberOfVideos,
      matchConfig,
    });
  }

  getSettlementResult(result: RoundResultType, matchConfig: MatchConfigType) {
    return getSettlementResult(result, matchConfig);
  }

  updateSecondHalfOdds(odds: Record<string, number>[], settlementResult: RoundSettlementResultType) {
    const secondHalfOdds = { ...odds[1] };
    if (settlementResult[0].odd === SettlementStatus.WIN) {
      odds[1].odd = secondHalfOdds.even;
      odds[1].even = secondHalfOdds.odd;
    }
    return odds;
  }
}
