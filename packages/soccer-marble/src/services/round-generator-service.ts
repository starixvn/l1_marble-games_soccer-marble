import { MatchConfig, GameRunningRound, GameSettings, AppContainer, Match, RateConfig } from "../types";
import { secureShuffle, secureRandomBool } from "sc-core-rng";
import { OddsGeneratorService } from "./odds-generator-service";
import { ResultGeneratorService } from "./result-generator-service";
import { encrypt, idHelper } from "@soccer-marble/shared-utils";
import { GameData } from "../crons/game-data";
import { oddsHelper } from "../helpers";

export class RoundGeneratorService {
  protected readonly gameSettings: GameSettings;
  protected readonly rateConfigs: any;
  protected readonly gameData: GameData;
  protected readonly oddsGeneratorService: OddsGeneratorService;
  protected readonly resultGeneratorService: ResultGeneratorService;

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

  createNewMatchConfig(): MatchConfig {
    const isHomeFavorite = secureRandomBool();
    const configs = secureShuffle(isHomeFavorite ? this.rateConfigs.homeFavorite : this.rateConfigs.awayFavorite).slice(
      0,
      this.gameSettings.gameTiming.timelines.length
    ) as RateConfig[];

    const eventDetailInfos = configs.map((config, index) => ({
      rateConfig: config,
      phase: index,
      oddsInfo: this.oddsGeneratorService.calculateOddsInfo(config.scoreRate),
    }));

    const fullTimeScoreRates = oddsHelper.mergeArrayOfRates(configs);
    const fulltimeOddsInfo = this.oddsGeneratorService.calculateOddsInfo(fullTimeScoreRates.scoreRate);

    return {
      gameTiming: this.gameSettings.gameTiming,
      numberOfEventDetails: this.gameSettings.gameTiming.timelines.length,
      eventDetailInfos,
      rateConfig: fullTimeScoreRates,
      oddsInfo: fulltimeOddsInfo,
    };
  }

  generateNewRound(roundId: number): GameRunningRound {
    const { homeTeam, awayTeam, theme } = this.createNewMatch(roundId);

    const matchConfig = this.createNewMatchConfig();

    const numberOfVideos = this.gameData.gameConfig?.config?.numberOfVideos ?? this.gameSettings.numberOfVideos;

    const result = this.resultGeneratorService.generateResult({
      numberOfVideos: numberOfVideos,
      matchConfig,
    });

    const odds = this.oddsGeneratorService.calculateOddsForRound(matchConfig, result);
    const selections = this.oddsGeneratorService.generateSelectionsForRound(odds, matchConfig, result);
    const settlementResult = this.resultGeneratorService.getSettlementResult(result, matchConfig);

    return {
      gameId: this.gameSettings.gameId,
      eventID: idHelper.createEventId(this.gameSettings.gameId, roundId),
      roundId,
      homeTeam,
      awayTeam,
      theme,
      matchConfig,
      odds,
      encryptedResult: encrypt(result),
      encryptedSettlementResult: encrypt(settlementResult),
      encryptedSelections: encrypt(selections),
      ended: false,
    } as GameRunningRound;
  }
}
