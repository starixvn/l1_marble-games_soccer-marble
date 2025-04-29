import express, { Request, Response } from "express";
import mongoose from "mongoose";
import http from "http";
import { Container } from "./container-registry";
import { GameCron } from "./crons/game-cron";
import { logger } from "sc-common";
import appConfig from "./config/game-config";

// Create Express app
const app = express();

// Middleware
app.use(express.json());

app.get("/", (req, res, next) => {
  res.send(`Soccer marble service running`);
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

const httpServer = http.createServer(app);

// Connect to MongoDB
mongoose
  .connect("mongodb://service:S3rv1c3@10.10.50.14:8708/marble_odds_feed?replicaSet=BotsRS&authSource=admin&tls=false")
  .then(() => {
    console.log("Connected to MongoDB");

    // Start the server (only once)
    httpServer.listen(3000, () => {
      console.log(`Server running on port 3000`);

      // Handle graceful shutdown
      process.on("SIGINT", () => {
        console.log("SIGINT received. Shutting down gracefully...");
        httpServer.close(() => {
          mongoose.connection.close();
          process.exit(0);
        });
      });

      process.on("SIGTERM", () => {
        console.log("SIGTERM received. Shutting down gracefully...");
        httpServer.close(() => {
          mongoose.connection.close();
          process.exit(0);
        });
      });
    });
  })
  .catch((err: Error) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

logger.start(appConfig.sentry as any);
const container = new Container();
container.register();
// const startUp = new StartUp(container.container as unknown as AppContainer);
// startUp.start();

const gameCron = container.container.resolve<GameCron>("gameCron");
gameCron.start();
