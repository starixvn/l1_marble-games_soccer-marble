import { GameCron } from "./crons/game-cron";
import { AppContainer } from "./types";

export class StartUp {
  gameCron: GameCron;

  constructor(container: AppContainer) {
    this.gameCron = container.gameCron;
  }

  async start() {
    await this.gameCron.start();
  }
}
