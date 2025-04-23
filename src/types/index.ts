import { logger } from "sc-common";
import { EventDetailModel, EventModel, RoundModel } from "../models";
import { GameCron } from "../crons/game-cron";

export type RateConfig = {
  scoreRate: Record<string, number>;
};

export type HalfConfigType = RateConfig & {
  overUnderValue?: number;
  handicapValue?: number;
};

export type MatchConfigType = {
  firstHalf: HalfConfigType;
  secondHalf: HalfConfigType;
  overUnderValue?: number;
  handicapValue?: number;
};

export enum SettlementStatus {
  PLAY = "P",
  LOSE = "L",
  WIN = "W",
  DRAW = "D",
}

export type Selection = {
  name: string;
  price: number;
  point: number;
  settlementStatus: SettlementStatus;
};

export type EventDetail = {
  eventId: number;
  oddsAvailableTs: Date;
  scheduleStartTs: Date;
  resultsAvailableTs: Date;
  playlist?: string;
  goalInfo?: string;
  selections?: Selection[];
  result?: string;
};

export type DrawResultType = {
  playlist: string;
  goalInfo?: string;
  result: string;
};

export type RoundResultType = {
  drawResults: DrawResultType[];
};

export type DrawSettlementResultType = Record<string, SettlementStatus>;
export type RoundSettlementResultType = DrawSettlementResultType[];

export type Event = {
  eventID: number;
  eventNameAKey: string;
  eventNameBKey: string;
  gameId: number;
  eventDetails: EventDetail[];
  startTime: Date;
  endTime: Date;
};

export interface AppContainer {
  logService: typeof logger;
  gameSettings: GameSettings;
  rateConfigs: RateConfig[];
  eventDetailsRepository: typeof EventDetailModel;
  eventRepository: typeof EventModel;
  roundRepository: typeof RoundModel;
  gameCron: GameCron;
}

export type GameSettings = {
  gameId: number;
  upcomingEvents: number;
  gameTiming: GameTiming;
  teams: string[];
  numberOfVideos: Record<string, number>;
  choices: string[];
};

export type GameTiming = {
  wholeRound: number;
  timelines: Array<Timeline>;
};

export type Timeline = {
  [key in Phase]: number;
};

export enum Phase {
  OddsAvailable = "OddsAvailable",
  ScheduleStart = "ScheduleStart",
  ResultAvailable = "ResultAvailable",
}

export type DataResultType = {
  numberOfVideos: Record<string, number>;
  matchConfig: MatchConfigType;
};
