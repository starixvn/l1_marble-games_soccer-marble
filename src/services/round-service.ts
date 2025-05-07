import { AppContainer, GameSettings } from "../types";
import { RoundModel } from "../models";
import { IRound } from "../models/rounds";
import { IEventDetail } from "../models/event-details";

export class RoundService {
  private readonly roundRepository: typeof RoundModel;
  private readonly gameSettings: GameSettings;

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

  async insertOrUpdateRound(round: IRound): Promise<void> {
    await this.roundRepository.updateOne(
      { roundId: round.roundId, gameId: this.gameSettings.gameId },
      { $set: round },
      { upsert: true }
    );
  }

  async updateRoundEventDetailResult(roundId: number, eventDetails: IEventDetail[]): Promise<void> {
    await this.roundRepository.updateOne({ roundId, gameId: this.gameSettings.gameId }, { $set: { eventDetails } });
  }
}
