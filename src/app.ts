import express, { Request, Response } from "express";
import http from "http";
import { ContainerRegistry } from "./container-registry";
import { StartUp } from "./start-up";
import mongoose from "mongoose";
import { verifyAdminToken } from "./middleware/verify-token";
import { setSecurityHeaders } from "./middleware/security-header";
import { errorHandler } from "./middleware/error-handler";
import { enableGame } from "./handlers/game-enable-handler";

const run = async () => {
  const container = new ContainerRegistry().register();
  const appConfigs = container.resolve("appConfigs");
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
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
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

  startUp.start();
};

run().catch((error) => {
  console.error("App running error:", error);
  process.exit(1);
});
