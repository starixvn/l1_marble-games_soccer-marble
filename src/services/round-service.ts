import { AppContainer, GameSettings } from "../types";
import { RoundModel } from "../models";
import { IRound } from "../models/rounds";

// Round Manager class to handle round-related operations
export class RoundService {
  private roundRepository: typeof RoundModel;
  private gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.roundRepository = container.roundRepository;
    this.gameSettings = container.gameSettings;
  }

  async initializeRoundId(): Promise<number> {
    const round = await this.roundRepository.findOne({ gameId: this.gameSettings.gameId }, "roundId", {
      sort: { roundId: -1 },
    });
    return round?.roundId ?? 0;
  }

  async fetchLastRound(roundId: number): Promise<IRound | null> {
    return await this.roundRepository.findOne({ gameId: this.gameSettings.gameId, roundId }).lean().exec();
  }

  async markRoundAsEnded(roundId: number): Promise<void> {
    await this.roundRepository.updateOne({ roundId, gameId: this.gameSettings.gameId }, { $set: { ended: true } });
  }

  async saveNewRound(round: any): Promise<void> {
    await this.roundRepository.create(round);
  }
}
