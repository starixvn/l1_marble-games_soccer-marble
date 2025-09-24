import { AppContainer } from "./types";
import { logger } from "sc-common";
import { AwilixContainer } from "awilix";
import { Scheduler } from "./crons/scheduler";
import { Consumer } from "./crons/consumer";

export class StartUp {
  appConfigs: any;
  scheduler: Scheduler;
  consumer: Consumer;

  constructor(container: AwilixContainer<AppContainer>) {
    this.appConfigs = container.resolve("appConfigs");
    this.scheduler = container.resolve("scheduler");
    this.consumer = container.resolve("consumer");
  }

  async start() {
    try {
      await this.scheduler.start();
      await this.consumer.start();
    } catch (error) {
      logger.logError(`Failed to start scheduler or consumer: ${error}`);
    }
  }
}
