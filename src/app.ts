import express, { Request, Response } from "express";
import http from "http";
import { ContainerRegistry } from "./container-registry";
import { StartUp } from "./start-up";

const container = new ContainerRegistry().register();

const appConfigs = container.resolve("appConfigs");

const startUp = new StartUp(container);

// Create Express app
const app = express();

// Middleware
app.use(express.json());

app.set("port", appConfigs.hostingPort);

app.get("/", (req, res, next) => {
  res.send(`Soccer marble service running`);
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

const httpServer = http.createServer(app);

httpServer.listen(app.get("port"), async () => {
  console.log(`Express server started and running on port ${app.get("port")}!`);
});

startUp.start();
