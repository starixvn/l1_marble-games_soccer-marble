import { Document } from "mongoose";
import { logger } from "sc-common";
import { GameSettings } from "../config/game-settings";

export enum SettlementStatus {
  PLAY = "Play",
  LOSE = "Lose",
  WIN = "Win",
  DRAW = "Draw",
}

export interface Selection {
  name: string;
  price: number;
  settlementStatus: SettlementStatus;
}

export interface EventDetail {
  scheduleStartTs: Date;
  resultsAvailableTs: Date;
  playlist?: string;
  goalInfo?: string;
  selections?: Selection[];
  result?: Record<string, any>;
  encryptedResult: Record<string, any>;
}

export interface Event extends Document {
  eventID: number;
  eventNameAKey: string;
  eventNameBKey: string;
  gameId: number;
  eventDetails: EventDetail[];
  startTime: Date;
  endTime: Date;
}

export interface AppContainer {
  logService: typeof logger;
  gameSettings: GameSettings;
}
