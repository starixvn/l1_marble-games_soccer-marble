import { logger } from "sc-common";
import { EventDetailModel, EventModel, GameConfigModel, RoundModel } from "../models";
import { appConfigs, rateConfigs } from "../game-config";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { RoundGeneratorService } from "../services/round-generator-service";
import { GameConfigService } from "../services/game-config-service";
import { GameHandler } from "../crons/game-handler";
import Agenda from "agenda";
import { Scheduler } from "../crons/scheduler";
import { Consumer } from "../crons/consumer";
import { GameData } from "../crons/game-data";

export type RateConfig = {
  scoreRate: Record<string, number>;
};

export type HalfConfigType = RateConfig & {
  overUnderValue: number;
  handicapValue: number;
};

export type MatchConfigType = {
  firstHalf: HalfConfigType;
  secondHalf: HalfConfigType;
  overUnderValue: number;
  handicapValue: number;
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
  eventID: number;
  oddsAvailableTs: Date;
  scheduleStartTs: Date;
  resultsAvailableTs: Date;
  playlist?: string;
  goalInfo?: string;
  selections?: Selection[];
  result?: {
    goalSequence: string;
    finalScore: string;
  };
  hasResults: boolean;
};

export type DrawResultType = {
  playlist: string;
  goalInfo?: string;
  result: {
    goalSequence: string;
    finalScore: string;
  };
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
  scheduleStartTs: Date;
};

export interface AppContainer {
  appConfigs: typeof appConfigs;
  logService: typeof logger;
  gameSettings: GameSettings;
  rateConfigs: typeof rateConfigs;
  eventDetailsRepository: typeof EventDetailModel;
  eventRepository: typeof EventModel;
  roundRepository: typeof RoundModel;
  gameConfigRepository: typeof GameConfigModel;
  roundGeneratorService: RoundGeneratorService;
  roundService: RoundService;
  eventService: EventService;
  gameConfigService: GameConfigService;
  gameHandler: GameHandler;
  agenda: Agenda;
  scheduler: Scheduler;
  consumer: Consumer;
  gameData: GameData;
}

export type GameSettings = {
  gameId: number;
  upcomingEvents: number;
  gameTiming: GameTiming;
  teams: string[];
  numberOfVideos: Record<string, number>;
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

export type GameRunningRound = {
  roundId: number;
  roundTime: number;
  homeTeam: string;
  awayTeam: string;
  matchConfig: MatchConfigType;
  selections: Record<string, Selection>[];
  odds: Record<string, number>[];
  result: RoundResultType;
  settlementResult: RoundSettlementResultType;
  eventID: number;
  gameId: number;
  ended: boolean;
  encryptedResult: any;
  encryptedSettlementResult: any;
  encryptedSelections: any;
};

export type GameConfig = {
  gameId: number;
  config: any;
};

export enum JobName {
  ScheduleUpcomingEvent = "ScheduleUpcomingEvent",
  UpdateEventDetailOdds = "UpdateEventDetailOdds",
  UpdateEventDetailVideoInfo = "UpdateEventDetailVideoInfo",
  UpdateEventDetailResult = "UpdateEventDetailResult",
}
