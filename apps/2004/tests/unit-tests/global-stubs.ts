import { logger } from "sc-common";
import {
  AppContainer,
  GameConfig,
  GameSettings,
  RoundService,
  EventService,
  GameConfigService,
  GameHandler,
  GameData,
  Scheduler,
  Consumer,
  Configuration,
} from "@soccer-marble/soccer-marble-base";
import { stub } from "jest-auto-stub";
import { RoundGeneratorService } from "../../src/services/round-generator-service";
import { ResultGeneratorService } from "../../src/services/result-generator-service";
import { OddsGeneratorService } from "../../src/services/odds-generator-service";
import { rateConfigs } from "../../src/rate-configs";
import { gameSettings } from "../../src/game-settings";
import { appConfigs } from "../../src/game-config";

import { Agenda } from "agenda";
import { IRound } from "@soccer-marble/soccer-marble-base/dist/models/rounds";
import { IEventDetail } from "@soccer-marble/soccer-marble-base/dist/models/event-details";
import { IEvent } from "@soccer-marble/soccer-marble-base/dist/models/events";
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
