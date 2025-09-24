import { RoundResultType, MatchConfigType, GameRunningRound, GameSettings, AppContainer, Match } from "../types";
import { secureShuffle, secureRandomBool } from "sc-core-rng";
import { OddsGeneratorService } from "./odds-generator-service";
import { ResultGeneratorService } from "./result-generator-service";
import { encrypt, idHelper } from "@soccer-marble/shared-utils";
import { GameData } from "../crons/game-data";

export class RoundGeneratorService {
  private readonly gameSettings: GameSettings;
  private readonly rateConfigs: any;
  private readonly gameData: GameData;
  private readonly oddsGeneratorService: OddsGeneratorService;
  private readonly resultGeneratorService: ResultGeneratorService;

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.rateConfigs = container.rateConfigs;
    this.gameData = container.gameData;
    this.oddsGeneratorService = container.oddsGeneratorService;
    this.resultGeneratorService = container.resultGeneratorService;
  }

  createNewMatchFromRandomTeams() {
    const teams = this.gameData.gameConfig?.config?.teams?.length
      ? this.gameData.gameConfig?.config?.teams
      : this.gameSettings.teams;
    const [homeTeam, awayTeam] = secureShuffle(teams);
    return { homeTeam, awayTeam, theme: this.gameSettings.theme };
  }

  createNewMatchFromMatches(roundId: number) {
    const teams = this.gameData.gameConfig?.config?.teams?.length
      ? this.gameData.gameConfig?.config?.teams
      : this.gameSettings.teams;
    const matches = this.gameData.gameConfig?.config?.matches;

    if (!matches || matches.length === 0) {
      return this.createNewMatchFromRandomTeams();
    }

    const match = matches[roundId % matches.length];

    if (!teams.includes(match.homeTeam) || !teams.includes(match.awayTeam)) {
      return this.createNewMatchFromRandomTeams();
    }

    match.theme = match.theme ?? this.gameSettings.theme;

    return match;
  }

  createNewMatch(roundId: number): Match {
    const teamSelectionMode = this.gameData.gameConfig?.config?.teamSelectionMode ?? 1;

    if (teamSelectionMode === 2) {
      return this.createNewMatchFromMatches(roundId);
    }

    return this.createNewMatchFromRandomTeams();
  }

  createNewMatchConfig(): MatchConfigType {
    const isHomeFavorite = secureRandomBool();
    const configs = secureShuffle(isHomeFavorite ? this.rateConfigs.homeFavorite : this.rateConfigs.awayFavorite);

    return {
      firstHalf: configs[0],
      secondHalf: configs[1],
    } as MatchConfigType;
  }

  generateRoundOddsAndUpdateMatchConfig(matchConfig: MatchConfigType, firstHalfResult: string) {
    return this.oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfResult);
  }

  generateResult(matchConfig: MatchConfigType, numberOfVideos: Record<string, number>) {
    return this.resultGeneratorService.generateResult({
      numberOfVideos,
      matchConfig,
    });
  }

  getSettlementResult(result: RoundResultType, matchConfig: MatchConfigType) {
    return this.resultGeneratorService.getSettlementResult(result, matchConfig);
  }

  generateNewRound(roundId: number) {
    const newRound = {
      gameId: this.gameSettings.gameId,
      eventID: idHelper.createEventId(this.gameSettings.gameId, roundId),
      roundId,
      ended: false,
    } as GameRunningRound;

    const { homeTeam, awayTeam, theme } = this.createNewMatch(roundId);
    newRound.homeTeam = homeTeam;
    newRound.awayTeam = awayTeam;
    newRound.theme = theme;

    newRound.matchConfig = this.createNewMatchConfig();

    const numberOfVideos = this.gameData.gameConfig?.config?.numberOfVideos ?? this.gameSettings.numberOfVideos;

    const result = this.generateResult(newRound.matchConfig, numberOfVideos);

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
