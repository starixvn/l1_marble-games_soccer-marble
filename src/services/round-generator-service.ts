import { RoundResultType, MatchConfigType, GameRunningRound, GameSettings, RateConfig, AppContainer } from "../types";
import { securePickOne, secureShuffle } from "sc-core-rng";
import { calculateOddsForRound } from "../helpers/odds-helper";
import { generateResult, getSettlementResult } from "../helpers/result-helper";
import { encrypt } from "../helpers/crypto-helper";

export class RoundGeneratorService {
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

  generateNewRound(roundId: number) {
    const newRound = {
      eventID: roundId,
      roundId,
    } as GameRunningRound;

    const { homeTeam, awayTeam } = this.createNewMatch();
    newRound.homeTeam = homeTeam;
    newRound.awayTeam = awayTeam;

    newRound.matchConfig = this.createNewMatchConfig();

    const result = this.generateResult(newRound.matchConfig, this.gameSettings.numberOfVideos);

    const { odds, matchConfig, selections } = this.generateRoundOddsAndUpdateMatchConfig(
      newRound.matchConfig,
      result.drawResults[0].result.goalSequence
    );

    newRound.odds = odds;
    newRound.matchConfig = matchConfig;

    const settlementResult = this.getSettlementResult(result, newRound.matchConfig);

    newRound.encryptedResult = encrypt(result);
    newRound.encryptedSettlementResult = encrypt(settlementResult);
    newRound.encryptedSelections = encrypt(selections);

    return newRound;
  }
}
