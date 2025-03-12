import dotenv from "dotenv";
import { GameConfig } from "../types";

// Load environment variables
dotenv.config();

// Server configuration
export const PORT = process.env.PORT || 3000;
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/soccer-events";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key";

// Game configuration
export const gameConfig: GameConfig = {
  eventsPerGeneration: parseInt(process.env.EVENTS_PER_GENERATION || "4", 10),
  gameHalfDurationSeconds: parseInt(process.env.GAME_HALF_DURATION_SECONDS || "60", 10),
  breakDurationSeconds: parseInt(process.env.BREAK_DURATION_SECONDS || "30", 10),
  generationIntervalMinutes: parseInt(process.env.GENERATION_INTERVAL_MINUTES || "10", 10),
};
