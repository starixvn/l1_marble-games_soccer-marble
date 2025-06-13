import { logger } from "sc-common";
import mongoose from "mongoose";
import { appConfigs } from "./game-config";
import { Agenda } from "agenda";

export class Configuration {
  private buildAgendaMongoUri(config: typeof appConfigs): string {
    const params = new URLSearchParams();

    if (config.agenda.authSource) {
      params.append("authSource", config.agenda.authSource);
    }

    if (config.agenda.replicaSet) {
      params.append("replicaSet", config.agenda.replicaSet);
    }

    return `${config.agenda.url}/${config.agenda.dbName}?${params.toString()}`;
  }

  async configureAgenda(config: typeof appConfigs) {
    try {
      const agenda = new Agenda({
        db: {
          address: this.buildAgendaMongoUri(config),
          collection: "jobs",
        },
        processEvery: "1 second",
        defaultLockLifetime: 5000,
      });

      await agenda.start();
      logger.log("Agenda connected to MongoDB successfully", "info");

      return { agenda, connected: true };
    } catch (error) {
      logger.logError(`Agenda connection error: ${error}`);
      return { agenda: null, connected: false };
    }
  }

  async configureDatabaseAndSentry(config: typeof appConfigs) {
    logger.start(config.sentry as any);
    await this.configureDatabase(config.database);
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
