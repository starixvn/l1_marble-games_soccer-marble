import {  RoundResultType, MatchConfigType, GameSettings, RateConfig, AppContainer } from "../types";
import { securePickOne, secureShuffle } from "sc-core-rng";
import { calculateOddsForRound } from "../helpers/odds-helper";
import { generateResult, getSettlementResult } from "../helpers/result-helper";

export class MatchGeneratorService {
  private readonly gameSettings: GameSettings;
  private readonly rateConfigs: RateConfig[];

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.rateConfigs = container.rateConfigs;
  }

  createNewMatch(): { homeTeam: string; awayTeam: string } {
    const [homeTeam, awayTeam] = secureShuffle(this.gameSettings.teams);
    return { homeTeam, awayTeam };
  }

  createNewMatchConfig(): MatchConfigType {
    return {
      firstHalf: securePickOne(this.rateConfigs),
      secondHalf: securePickOne(this.rateConfigs),
    };
  }

  generateRoundOddsAndUpdateMatchConfig(matchConfig: MatchConfigType, firstHalfResult: string) {
    return calculateOddsForRound(matchConfig, firstHalfResult);
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
}
