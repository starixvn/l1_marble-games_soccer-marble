import { GameCron } from "./crons/game-cron";
import { AppContainer } from "./types";
import appConfig from "./game-config";
import { logger } from "sc-common";
import { AwilixContainer } from "awilix";
import mongoose from "mongoose";

export class StartUp {
  gameCron: GameCron;
  appConfigs: typeof appConfig;

  constructor(container: AwilixContainer<AppContainer>) {
    this.gameCron = container.resolve("gameCron");
    this.appConfigs = container.resolve("appConfigs");
  }

  async start() {
    try {
      logger.start(this.appConfigs.sentry as any);
      await this.configureDatabase(this.appConfigs.database);
      await this.gameCron.start();
    } catch (error) {
      logger.logError(`Failed to start the server ${error}`);
      console.log(error);
    }
  }

  async configureDatabase({ url = "", options = {} }) {
    await mongoose
      .connect(url, options)
      .then(() => {
        console.log("Connect to MongoDB success " + url);
      })
      .catch((error) => {
        console.log("Connect to MongoDB failed", error);
        logger.logError(error);
      });

    mongoose.connection.once("open", function () {
      console.log("MongoDB database connection established successfully");
    });

    mongoose.connection.on("connected", () => {
      const message = `MongoDB connected at ${new Date()}`;
      logger.log(message, "info");
    });

    mongoose.connection.on("reconnected", () => {
      const message = `MongoDB reconnected at ${new Date()}`;
      logger.logWarning(message);
    });

    mongoose.connection.on("disconnected", () => {
      logger.logWarning(`MongoDB disconnected at ${new Date()}`);
      process.exit(1);
    });

    mongoose.connection.on("error", (err) => {
      logger.logError(err);
    });
  }
}
