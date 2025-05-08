import { AppContainer, GameConfig, GameSettings } from "../types";
import { GameConfigModel } from "../models";

export class GameConfigService {
  private gameConfigRepository: typeof GameConfigModel;
  private gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.gameConfigRepository = container.gameConfigRepository;
    this.gameSettings = container.gameSettings;
  }

  async getGameConfig(): Promise<GameConfig | null> {
    return await this.gameConfigRepository.findOne({ gameId: this.gameSettings.gameId });
  }

  async setGameEnabled(enabled: boolean): Promise<GameConfig | null> {
    return await this.gameConfigRepository.findOneAndUpdate(
      { gameId: this.gameSettings.gameId },
      { enabled },
      { new: true, upsert: true }
    );
  }
}
