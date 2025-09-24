import { AppContainer, GameConfig } from "../types";
import { logger } from "sc-common";
import { GameConfigService } from "../services/game-config-service";

export class GameData {
  private readonly gameConfigService: GameConfigService;
  private readonly logService: typeof logger;
  gameConfig: GameConfig | null = null;

  constructor(container: AppContainer) {
    this.logService = container.logService;
    this.gameConfigService = container.gameConfigService;
  }

  async loadGameConfig() {
    const gameConfig = await this.gameConfigService.getGameConfig();

    if (!gameConfig) {
      this.logService.logError("Game config not found, creating new game config");
      this.gameConfig = await this.gameConfigService.createNewGameConfig();
    } else {
      this.gameConfig = gameConfig;
    }
  }
}
