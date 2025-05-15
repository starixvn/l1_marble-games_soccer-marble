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
    const timelines = this.gameSettings.gameTiming.timelines;

    for (const [drawIndex, timeline] of timelines.entries()) {
      if (currentRoundTime === timeline.OddsAvailable && drawIndex !== 0) {
        await this.gameStateManager.handleOddsAvailableForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ScheduleStart) {
        await this.gameStateManager.handleVideoInfoAvailableForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable) {
        await this.gameStateManager.handleResultAvailableForDraw(drawIndex);
      }

      if (currentRoundTime === timeline.ResultAvailable && drawIndex === timelines.length - 1) {
        await this.gameStateManager.handleRoundSettle();
      }
    }
  }
}
