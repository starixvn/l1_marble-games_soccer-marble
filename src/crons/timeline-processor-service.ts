import { AppContainer, GameSettings } from "../types";
import { GameStateManager } from "./game-state-manager";

export class TimelineProcessor {
  private readonly gameStateManager: GameStateManager;
  private readonly gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.gameStateManager = container.gameStateManager;
    this.gameSettings = container.gameSettings;
  }

  async processTimelines(currentRoundTime: number) {
    const gameState = this.gameStateManager;
    const timelines = this.gameSettings.gameTiming.timelines;

    for (const [drawIndex, timeline] of timelines.entries()) {
      if (currentRoundTime === timeline.OddsAvailable && drawIndex !== 0) {
        await this.gameStateManager.updateOddsForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ScheduleStart) {
        await gameState.updateVideoInfoForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable) {
        await gameState.updateResultForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable && drawIndex === timelines.length - 1) {
        await gameState.settleRound();
      }
    }
  }
}
