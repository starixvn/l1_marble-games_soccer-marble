import { AppContainer, GameConfig, GameSettings } from "../types";
import { GameConfigModel } from "../models";
import { logger } from "sc-common";
export class GameConfigService {
  private gameConfigRepository: typeof GameConfigModel;
  private gameSettings: GameSettings;
  private logService: typeof logger;

  constructor(container: AppContainer) {
    this.gameConfigRepository = container.gameConfigRepository;
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
  }

  async getGameConfig(): Promise<GameConfig | null> {
    return await this.gameConfigRepository.findOne({ gameId: this.gameSettings.gameId });
  }

  async setGameEnabled(enabled: boolean): Promise<GameConfig | null> {
    this.logService.log(`Game Configs: set game enabled to ${enabled}`, "info");

    return await this.gameConfigRepository.findOneAndUpdate(
      { gameId: this.gameSettings.gameId },
      { enabled },
      { new: true, upsert: true }
    );
  }
}
