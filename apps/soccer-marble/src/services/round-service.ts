import { AppContainer, GameSettings } from "../types";
import { IRound } from "../models/rounds";
import { IEventDetail } from "../models/event-details";
import { logger } from "sc-common";
import { Model } from "mongoose";

export class RoundService {
  private readonly roundRepository: Model<IRound>;
  private readonly gameSettings: GameSettings;
  private readonly logService: typeof logger;

  constructor(container: AppContainer) {
    this.roundRepository = container.roundRepository;
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
  }

  async initializeRoundId(): Promise<number> {
    const round = await this.roundRepository.findOne({ gameId: this.gameSettings.gameId }, "roundId", {
      sort: { roundId: -1 },
    });
    return round?.roundId ?? 0;
  }

  async fetchRoundData(roundId: number): Promise<IRound> {
    const round = await this.roundRepository.findOne({ gameId: this.gameSettings.gameId, roundId }).lean().exec();

    if (!round) {
      this.logService.logError(`Round not found for roundId ${roundId}`);
      throw new Error(`Round not found for roundId ${roundId}`);
    }

    return round;
  }

  async markRoundAsEnded(roundId: number): Promise<void> {
    await this.roundRepository.updateOne({ roundId, gameId: this.gameSettings.gameId }, { $set: { ended: true } });
  }

  async insertRound(round: IRound): Promise<void> {
    await this.roundRepository.create(round);
  }

  async updateRound(round: IRound): Promise<void> {
    await this.roundRepository.updateOne({ roundId: round.roundId, gameId: this.gameSettings.gameId }, { $set: round });
  }

  async updateRoundEventDetailResult(roundId: number, eventDetails: IEventDetail[]): Promise<void> {
    await this.roundRepository.updateOne({ roundId, gameId: this.gameSettings.gameId }, { $set: { eventDetails } });
  }
}
