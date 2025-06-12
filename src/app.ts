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
import gameConfig from "./game-config";
import { logger } from "sc-common";

const buildAgendaMongoUri = (config: typeof gameConfig): string => {
  const params = new URLSearchParams();

  if (config.agenda.authSource) {
    params.append("authSource", config.agenda.authSource);
  }

  if (config.agenda.replicaSet) {
    params.append("replicaSet", config.agenda.replicaSet);
  }

  return `${config.agenda.url}/${config.agenda.dbName}?${params.toString()}`;
};

const configureAgenda = async (appConfigs: typeof gameConfig, logService: typeof logger) => {
  try {
    const agenda = new Agenda({
      db: {
        address: buildAgendaMongoUri(appConfigs),
        collection: "jobs",
      },
      processEvery: "1 second",
      defaultLockLifetime: 5000,
    });

    await agenda.start();
    logService.log("Agenda connected to MongoDB successfully", "info");

    return { agenda, connected: true };
  } catch (error) {
    logService.logError(`Agenda connection error: ${error}`);
    return { agenda: null, connected: false };
  }
};

const run = async () => {
  const container = new ContainerRegistry().register();
  const appConfigs = container.resolve("appConfigs");
  const logService = container.resolve("logService");
  const { agenda, connected: agendaConnected } = await configureAgenda(appConfigs, logService);

  if (!agenda) {
    throw new Error("Agenda connection failed! Please check the MongoDB connection details.");
  }

  container.register({
    agenda: asValue(agenda),
  });

  const gameConfigService = container.resolve("gameConfigService");
  const startUp = new StartUp(container);

  await startUp.configureDatabaseAndSentry();

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

  await startUp.start();
};

run().catch((error) => {
  console.error("App running error:", error);
  process.exit(1);
});
