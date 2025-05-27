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

  async configureDatabaseAndSentry() {
    logger.start(this.appConfigs.sentry as any);
    await this.configureDatabase(this.appConfigs.database);
  }

  async start() {
    await this.gameCron.start();
  }

  async configureDatabase({ url = "", options = {} }) {
    try {
      await mongoose.connect(url, options);

      this.setupMongoEventHandlers();
      logger.log("MongoDB database connection established successfully", "info");
    } catch (error) {
      logger.logError(`Failed to connect to MongoDB: ${error}`);
    }
  }

  private setupMongoEventHandlers() {
    mongoose.connection.on("connected", () => {
      logger.log(`MongoDB connected at ${new Date()}`, "info");
    });

    mongoose.connection.on("reconnected", () => {
      logger.logWarning(`MongoDB reconnected at ${new Date()}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.logWarning(`MongoDB disconnected at ${new Date()}`);
    });

    mongoose.connection.on("error", (err) => {
      logger.logError(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("close", () => {
      logger.logWarning("MongoDB connection pool closed");
    });
  }
}
