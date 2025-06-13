import { AppContainer, GameConfig, GameSettings } from "../types";
import { GameConfigModel } from "../models";
export class GameConfigService {
  private readonly gameConfigRepository: typeof GameConfigModel;
  private readonly gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.gameConfigRepository = container.gameConfigRepository;
    this.gameSettings = container.gameSettings;
  }

  async getGameConfig(): Promise<GameConfig | null> {
    return this.gameConfigRepository.findOne({ gameId: this.gameSettings.gameId }).lean().exec();
  }

  async createNewGameConfig() {
    return this.gameConfigRepository.create({
      gameId: this.gameSettings.gameId,
      config: {
        enabled: false,
      },
    });
  }
}
