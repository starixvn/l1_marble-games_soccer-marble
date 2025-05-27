import { AppContainer, GameConfig, GameSettings } from "../types";
import { GameConfigModel } from "../models";
import { logger } from "sc-common";
export class GameConfigService {
  private readonly gameConfigRepository: typeof GameConfigModel;
  private readonly gameSettings: GameSettings;
  private readonly logService: typeof logger;

  constructor(container: AppContainer) {
    this.gameConfigRepository = container.gameConfigRepository;
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
  }

  async getGameConfig(): Promise<GameConfig | null> {
    return this.gameConfigRepository.findOne({ gameId: this.gameSettings.gameId }).lean().exec();
  }

  async setGameEnabled(enabled: boolean): Promise<GameConfig | null> {
    this.logService.log(`Game Configs: set game enabled to ${enabled}`, "info");

    return this.gameConfigRepository.findOneAndUpdate(
      { gameId: this.gameSettings.gameId },
      { enabled },
      { new: true, upsert: true }
    );
  }
}
