import {
  AppContainer,
  Configuration,
  Consumer,
  EventService,
  GameConfig,
  GameConfigService,
  GameData,
  GameHandler,
  RoundService,
  Scheduler,
} from "@soccer-marble/soccer-marble-base";
import { stub } from "jest-auto-stub";
import { logger } from "sc-common";
import { OddsGeneratorService } from "../../src/services/odds-generator-service";
import { ResultGeneratorService } from "../../src/services/result-generator-service";
import { RoundGeneratorService } from "../../src/services/round-generator-service";

import { IEventDetail } from "@soccer-marble/soccer-marble-base/dist/models/event-details";
import { IEvent } from "@soccer-marble/soccer-marble-base/dist/models/events";
import { IRound } from "@soccer-marble/soccer-marble-base/dist/models/rounds";
import { Agenda } from "agenda";
import mongoose from "mongoose";

const mockLogService: typeof logger = {
  log: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
} as unknown as typeof logger;

const mockRoundGeneratorService = stub<RoundGeneratorService>();
const mockRoundService = stub<RoundService>();
const mockEventService = stub<EventService>();
const mockGameConfigService = stub<GameConfigService>();
const mockResultGeneratorService = stub<ResultGeneratorService>();
const mockOddsGeneratorService = stub<OddsGeneratorService>();

const mockGameHandler = stub<GameHandler>();
const mockGameData = stub<GameData>();
const mockScheduler = stub<Scheduler>();
const mockConsumer = stub<Consumer>();
const mockAgenda = stub<Agenda>();

const mockEventRepository = {
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findOneAndUpdate: jest.fn().mockReturnThis(),
  updateOne: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
} as unknown as mongoose.Model<IEvent>;

const mockEventDetailsRepository = {
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findOneAndUpdate: jest.fn().mockReturnThis(),
  updateOne: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
} as unknown as mongoose.Model<IEventDetail>;

const mockGameConfigRepository = {
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findOneAndUpdate: jest.fn().mockReturnThis(),
  updateOne: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
} as unknown as mongoose.Model<GameConfig>;

const mockRoundRepository = {
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findOneAndUpdate: jest.fn().mockReturnThis(),
  updateOne: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
} as unknown as mongoose.Model<IRound>;

const mockConfiguration = stub<Configuration>();

const gameSettings = {
  gameId: 2004,
  modelPrefix: "soccer_marble_live",
  upcomingEvents: 3,
  theme: "youtube",
  gameTiming: {
    wholeRound: 100,
    timelines: [],
    extraInfo: {
      videoLength: 40,
      oddsDuration: 10,
      resultDuration: 10,
      halfTimeDuration: 20,
      afterGoalDuration: 3,
    },
  },
  teams: [
    "nt_arg",
    "nt_esp",
    "nt_fra",
    "nt_eng",
    "nt_bra",
    "nt_ned",
    "nt_por",
    "nt_ger",
    "clb_rma",
    "clb_mci",
    "clb_fcb",
    "clb_liv",
    "clb_che",
    "clb_int",
    "clb_bar",
    "clb_ars",
  ],
  numberOfVideos: {
    A: 29,
    H: 29,
    0: 1,
  },
};

const config = {
  scoreRate: {
    "1-0": 0.55,
    "0-1": 0.45,
  },
};

const rateConfigs = {
  homeFavorite: [config],
  homeFavoriteDraw: [config],
  awayFavorite: [config],
  awayFavoriteDraw: [config],
};

const appConfigs = {
  hostingPort: 5000,
  database: {
    url: process.env.NODE_ENV === "production" ? "mongodb://host.docker.internal:27017" : "mongodb://localhost:27017",
    options: {
      dbName: "marble-football",
    },
  },
  agenda: {
    url: process.env.NODE_ENV === "production" ? "mongodb://host.docker.internal:27017" : "mongodb://localhost:27017",
    authSource: "",
    dbName: "marble-football",
    collectionName: "soccer_marble_live_jobs",
    replicaSet: "",
  },
};

const mockContainer: AppContainer = {
  gameSettings,
  appConfigs,
  rateConfigs,

  gameHandler: mockGameHandler,
  agenda: mockAgenda,
  scheduler: mockScheduler,
  consumer: mockConsumer,
  gameData: mockGameData,

  logService: mockLogService,
  roundGeneratorService: mockRoundGeneratorService,
  roundService: mockRoundService,
  eventService: mockEventService,
  gameConfigService: mockGameConfigService,

  eventDetailsRepository: mockEventDetailsRepository,
  eventRepository: mockEventRepository,
  gameConfigRepository: mockGameConfigRepository,
  roundRepository: mockRoundRepository,
  resultGeneratorService: mockResultGeneratorService,
  oddsGeneratorService: mockOddsGeneratorService,
  configuration: mockConfiguration,
};

export { mockContainer };
