import { ContainerRegistry } from "../../src/container-registry";
import { GameCron } from "../../src/crons/game-cron";
import { GameStateManager } from "../../src/crons/game-state-manager";
import { TimelineProcessor } from "../../src/crons/timeline-processor";
import { RoundScheduler } from "../../src/crons/round-scheduler";
import { RoundGeneratorService } from "../../src/services/round-generator-service";
import { RoundService } from "../../src/services/round-service";
import { EventService } from "../../src/services/event-service";
import { GameConfigService } from "../../src/services/game-config-service";
import { EventDetailModel, EventModel, RoundModel, GameConfigModel } from "../../src/models";
import appConfig from "../../src/game-config";
import { gameSettings } from "../../src/game-settings";
import { rateConfigs } from "../../src/rate-config";
import { logger } from "sc-common";

// Mock all dependencies
jest.mock("sc-common", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("../../src/crons/game-cron");
jest.mock("../../src/crons/game-state-manager");
jest.mock("../../src/crons/timeline-processor");
jest.mock("../../src/crons/round-scheduler");
jest.mock("../../src/services/round-generator-service");
jest.mock("../../src/services/round-service");
jest.mock("../../src/services/event-service");
jest.mock("../../src/services/game-config-service");
jest.mock("../../src/models");

describe("ContainerRegistry", () => {
  let containerRegistry: ContainerRegistry;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    containerRegistry = new ContainerRegistry();
  });

  describe("constructor", () => {
    it("should create container with PROXY injection mode", () => {
      expect(containerRegistry.container).toBeDefined();
      expect(containerRegistry.container.options.injectionMode).toBe("PROXY");
    });
  });

  describe("register", () => {
    it("should register all components successfully", () => {
      const container = containerRegistry.register();

      // Test configs registration
      expect(container.resolve("appConfigs")).toBe(appConfig);
      expect(container.resolve("gameSettings")).toBe(gameSettings);
      expect(container.resolve("rateConfigs")).toBe(rateConfigs);

      // Test models registration
      expect(container.resolve("eventDetailsRepository")).toBe(EventDetailModel);
      expect(container.resolve("eventRepository")).toBe(EventModel);
      expect(container.resolve("roundRepository")).toBe(RoundModel);
      expect(container.resolve("gameConfigRepository")).toBe(GameConfigModel);

      // Test services registration
      expect(container.resolve("roundGeneratorService")).toBeInstanceOf(RoundGeneratorService);
      expect(container.resolve("roundService")).toBeInstanceOf(RoundService);
      expect(container.resolve("eventService")).toBeInstanceOf(EventService);
      expect(container.resolve("gameConfigService")).toBeInstanceOf(GameConfigService);
      expect(container.resolve("logService")).toBe(logger);

      // Test crons registration
      expect(container.resolve("gameCron")).toBeInstanceOf(GameCron);
      expect(container.resolve("gameStateManager")).toBeInstanceOf(GameStateManager);
      expect(container.resolve("timelineProcessor")).toBeInstanceOf(TimelineProcessor);
      expect(container.resolve("roundScheduler")).toBeInstanceOf(RoundScheduler);
    });
  });

  describe("registerConfigs", () => {
    it("should register all configs as values", () => {
      containerRegistry.registerConfigs();
      const container = containerRegistry.container;

      expect(container.resolve("appConfigs")).toBe(appConfig);
      expect(container.resolve("gameSettings")).toBe(gameSettings);
      expect(container.resolve("rateConfigs")).toBe(rateConfigs);
    });
  });

  describe("registerModels", () => {
    it("should register all models as values", () => {
      containerRegistry.registerModels();
      const container = containerRegistry.container;

      expect(container.resolve("eventDetailsRepository")).toBe(EventDetailModel);
      expect(container.resolve("eventRepository")).toBe(EventModel);
      expect(container.resolve("roundRepository")).toBe(RoundModel);
      expect(container.resolve("gameConfigRepository")).toBe(GameConfigModel);
    });
  });

  describe("registerServices", () => {
    it("should register all services as singletons", () => {
      containerRegistry.registerServices();
      const container = containerRegistry.container;

      // Test service instances
      const service1 = container.resolve("roundGeneratorService");
      const service2 = container.resolve("roundGeneratorService");
      expect(service1).toBe(service2);

      // Test all services are registered
      expect(container.resolve("logService")).toBe(logger);
      expect(container.resolve("roundGeneratorService")).toBeInstanceOf(RoundGeneratorService);
      expect(container.resolve("roundService")).toBeInstanceOf(RoundService);
      expect(container.resolve("eventService")).toBeInstanceOf(EventService);
      expect(container.resolve("gameConfigService")).toBeInstanceOf(GameConfigService);
    });
  });

  describe("registerCrons", () => {
    it("should register all crons as singletons", () => {
      containerRegistry.registerCrons();
      const container = containerRegistry.container;

      // Test cron instances
      const cron1 = container.resolve("gameCron");
      const cron2 = container.resolve("gameCron");
      expect(cron1).toBe(cron2);

      // Test all crons are registered
      expect(container.resolve("gameCron")).toBeInstanceOf(GameCron);
      expect(container.resolve("gameStateManager")).toBeInstanceOf(GameStateManager);
      expect(container.resolve("timelineProcessor")).toBeInstanceOf(TimelineProcessor);
      expect(container.resolve("roundScheduler")).toBeInstanceOf(RoundScheduler);
    });
  });

  describe("error handling", () => {
    it("should throw error when resolving unregistered component", () => {
      const container = containerRegistry.register();
      expect(() => container.resolve("nonExistentComponent")).toThrow();
    });
  });
});
