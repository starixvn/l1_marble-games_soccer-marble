import { logger } from "sc-common";
import mongoose from "mongoose";
import { Agenda } from "agenda";
import { AppContainer } from "./types";

export class Configuration {
  protected readonly appConfigs: any;
  protected readonly logService: typeof logger;

  constructor(container: AppContainer) {
    this.appConfigs = container.appConfigs;
    this.logService = container.logService;
  }

  buildAgendaMongoUri(): string {
    const params = new URLSearchParams();

    if (this.appConfigs.agenda.authSource) {
      params.append("authSource", this.appConfigs.agenda.authSource);
    }

    if (this.appConfigs.agenda.replicaSet) {
      params.append("replicaSet", this.appConfigs.agenda.replicaSet);
    }

    return `${this.appConfigs.agenda.url}/${this.appConfigs.agenda.dbName}?${params.toString()}`;
  }

  async configureAgenda() {
    try {
      const agenda = new Agenda({
        db: {
          address: this.buildAgendaMongoUri(),
          collection: this.appConfigs.agenda.collectionName,
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

  async configureDatabaseAndSentry() {
    this.logService.start(this.appConfigs.sentry);
    await this.configureDatabase(this.appConfigs.database);
  }

  async configureDatabase({ url = "", options = {} }) {
    try {
      await mongoose.connect(url, options);

      this.setupMongoEventHandlers();
      this.logService.log("MongoDB database connection established successfully", "info");
    } catch (error) {
      this.logService.logError(`Failed to connect to MongoDB: ${error}`);
    }
  }

  setupMongoEventHandlers() {
    mongoose.connection.on("connected", () => {
      this.logService.log(`MongoDB connected at ${new Date()}`, "info");
    });

    mongoose.connection.on("reconnected", () => {
      this.logService.logWarning(`MongoDB reconnected at ${new Date()}`);
    });

    mongoose.connection.on("disconnected", () => {
      this.logService.logWarning(`MongoDB disconnected at ${new Date()}`);
    });

    mongoose.connection.on("error", (err) => {
      this.logService.logError(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("close", () => {
      this.logService.logWarning("MongoDB connection pool closed");
    });
  }
}
