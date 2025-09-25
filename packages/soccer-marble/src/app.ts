import express, { Request, Response } from "express";
import http from "http";
import { StartUp } from "./start-up";
import mongoose from "mongoose";
import { setSecurityHeaders } from "./middleware/security-header";
import { errorHandler } from "./middleware/error-handler";
import Agenda from "agenda";
import { asValue, AwilixContainer } from "awilix";
import { logger } from "sc-common";
import { AppContainer } from "./types";
import { Configuration } from "./configuration";

export class App {
  protected readonly logService: typeof logger;
  protected readonly appConfigs: any;
  protected readonly configuration: Configuration;
  protected readonly container: AwilixContainer<AppContainer>;
  protected shuttingDown = false;

  constructor(container: AwilixContainer<AppContainer>) {
    this.logService = container.resolve("logService");
    this.appConfigs = container.resolve("appConfigs");
    this.configuration = container.resolve("configuration");
    this.container = container;
  }

  async gracefulShutdown(agenda: Agenda) {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;

    try {
      await agenda.stop();
      this.logService.log("Agenda disconnected. Gracefully shutting down...", "info");
    } catch (err) {
      this.logService.logError(`Error during shutdown: ${err}`);
      process.exit(1);
    }
  }

  async registerAgenda(agenda: Agenda) {
    this.container.register({
      agenda: asValue(agenda),
    });
  }

  async initializeAgenda() {
    const { agenda, connected } = await this.configuration.configureAgenda();

    if (!agenda) {
      throw new Error("Agenda connection failed! Please check the MongoDB connection details.");
    }

    this.registerAgenda(agenda);

    return { agenda, connected };
  }

  async run() {
    await this.configuration.configureDatabaseAndSentry();
    const { agenda, connected: agendaConnected } = await this.initializeAgenda();
    const startUp = new StartUp(this.container);

    // Create Express app
    const app = express();

    // Middleware
    app.use(express.json());
    app.use(setSecurityHeaders);
    app.use(errorHandler);

    app.set("port", this.appConfigs.hostingPort);

    // Routes
    app.get("/", (req: Request, res: Response) => {
      const dbStatus = mongoose.connection.readyState === 1 && agendaConnected ? "connected" : "disconnected";
      res.status(dbStatus === "connected" ? 200 : 500).json({
        status: dbStatus === "connected" ? "ok" : "error",
        message: "Soccer marble service running",
        database: dbStatus,
        timestamp: new Date().toISOString(),
      });
    });

    const httpServer = http.createServer(app);

    httpServer.listen(app.get("port"), () => {
      console.log(`Express server started and running on port ${app.get("port")}!`);
    });

    process.on("SIGTERM", async () => {
      await this.gracefulShutdown(agenda);
    });

    await startUp.start();
  }
}
