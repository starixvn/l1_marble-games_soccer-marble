import express, { Request, Response } from "express";
import http from "http";
import { ContainerRegistry } from "./container-registry";
import { StartUp } from "./start-up";
import mongoose from "mongoose";
import { verifyAdminToken } from "./middleware/verify-token";
import { setSecurityHeaders } from "./middleware/security-header";
import { errorHandler } from "./middleware/error-handler";
import { enableGame } from "./handlers/game-enable-handler";
import Agenda from "agenda";
import { asValue } from "awilix";
import { logger } from "sc-common";
import { Configuration } from "./configuration";

let shuttingDown = false;

const gracefulShutdown = async (agenda: Agenda, logService: typeof logger) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  try {
    await agenda.stop();
    await mongoose.disconnect();
    logService.log("Agenda and Mongoose disconnected. Gracefully shutting down...", "info");
  } catch (err) {
    logService.logError(`Error during shutdown: ${err}`);
    process.exit(1);
  }
};

const run = async () => {
  const container = new ContainerRegistry().register();
  const appConfigs = container.resolve("appConfigs");
  const logService = container.resolve("logService");
  const configuration = new Configuration();
  await configuration.configureDatabaseAndSentry(appConfigs);
  const { agenda, connected: agendaConnected } = await configuration.configureAgenda(appConfigs);

  if (!agenda) {
    throw new Error("Agenda connection failed! Please check the MongoDB connection details.");
  }

  container.register({
    agenda: asValue(agenda),
  });

  const gameConfigService = container.resolve("gameConfigService");
  const startUp = new StartUp(container);

  // Create Express app
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(setSecurityHeaders);
  app.use(errorHandler);

  app.set("port", appConfigs.hostingPort);

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

  app.post("/game/enable", verifyAdminToken(appConfigs.adminToken), enableGame(gameConfigService));

  const httpServer = http.createServer(app);

  httpServer.listen(app.get("port"), () => {
    console.log(`Express server started and running on port ${app.get("port")}!`);
  });

  process.on("SIGTERM", async () => {
    await gracefulShutdown(agenda, logService);
  });

  await startUp.start();
};

run().catch((error) => {
  console.error("App running error:", error);
  process.exit(1);
});
