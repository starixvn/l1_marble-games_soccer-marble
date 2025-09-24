import { logger } from "sc-common";
import { AppContainer, GameConfig, GameSettings } from "../../src/types";
import { stub } from "jest-auto-stub";
import { GameConfigService } from "../../src/services/game-config-service";
import { EventService } from "../../src/services/event-service";
import { RoundService } from "../../src/services/round-service";
import { RoundGeneratorService } from "../../src/services/round-generator-service";
import { IEvent } from "../../src/models/events";
import mongoose from "mongoose";
import { IEventDetail } from "../../src/models/event-details";
import { IRound } from "../../src/models/rounds";
import { GameHandler } from "../../src/crons/game-handler";
import { GameData } from "../../src/crons/game-data";
import { Scheduler } from "../../src/crons/scheduler";
import { Consumer } from "../../src/crons/consumer";
import { Agenda } from "agenda";
import { ResultGeneratorService } from "../../src/services/result-generator-service";
import { OddsGeneratorService } from "../../src/services/odds-generator-service";
import { Configuration } from "../../src/configuration";
const mockLogService: typeof logger = {
  log: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
} as unknown as typeof logger;

const gameSettings: GameSettings = {
  gameId: 2001,
  modelPrefix: "2001",
  upcomingEvents: 3,
  theme: "2001",
  gameTiming: {
    timelines: [
      { OddsAvailable: 10, ScheduleStart: 20, ResultAvailable: 30 },
      { OddsAvailable: 40, ScheduleStart: 50, ResultAvailable: 60 },
    ],
    wholeRound: 60,
  },
  teams: [
    "clb_rma",
    "clb_mci",
    "clb_fcb",
    "clb_psg",
    "clb_che",
    "clb_int",
    "clb_juv",
    "clb_atm",
    "clb_bvb",
    "clb_ben",
    "clb_por",
    "clb_fla",
    "clb_riv",
    "clb_pal",
    "clb_boj",
    "clb_mon",
  ],
  numberOfVideos: {
    AAAA: 2,
    AAAH: 6,
    AAA: 2,
    AAHA: 2,
    AAHH: 2,
    AAH: 2,
    AA: 2,
    AHAA: 3,
    AHAH: 3,
    AHA: 2,
    AHHA: 4,
    AHHH: 5,
    AHH: 2,
    AH: 15,
    A: 15,
    HAAA: 2,
    HAAH: 2,
    HAA: 11,
    HAHA: 2,
    HAHH: 2,
    HAH: 12,
    HA: 2,
    HHAA: 2,
    HHAH: 3,
    HHA: 8,
    HHHA: 2,
    HHHH: 2,
    HHH: 2,
    HH: 4,
    H: 19,
  },
};
const rateConfigs = {
  homeFavorite: [{ scoreRate: { "1-0": 0.2, "0-1": 0.1 } }, { scoreRate: { "1-0": 0.3, "0-1": 0.1 } }],
  awayFavorite: [{ scoreRate: { "1-0": 0.1, "0-1": 0.2 } }, { scoreRate: { "1-0": 0.1, "0-1": 0.3 } }],
};
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

const mockContainer: AppContainer = {
  gameSettings,
  appConfigs: {} as any,
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
