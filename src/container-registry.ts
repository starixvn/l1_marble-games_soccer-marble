import { AppContainer } from "./types/index";
import { createContainer, AwilixContainer, InjectionMode, asValue, asClass } from "awilix";
import { gameSettings } from "./game-settings";
import { rateConfigs } from "./rate-config";
import { logger } from "sc-common";
import { GameCron } from "./crons/game-cron";
import { EventDetailModel, EventModel, RoundModel, GameConfigModel } from "./models";
import appConfig from "./game-config";
import { RoundGeneratorService } from "./services/round-generator-service";
import { RoundService } from "./services/round-service";
import { EventService } from "./services/event-service";
import { GameConfigService } from "./services/game-config-service";
import { GameStateManager } from "./crons/game-state-manager";
import { TimelineProcessor } from "./crons/timeline-processor";
import { RoundScheduler } from "./crons/round-scheduler";

export class ContainerRegistry {
  container: AwilixContainer<AppContainer>;

  constructor() {
    this.container = createContainer<AppContainer>({
      injectionMode: InjectionMode.PROXY,
    });
  }

  register() {
    this.registerConfigs();
    this.registerModels();
    this.registerServices();
    this.registerCrons();

    return this.container;
  }

  registerConfigs() {
    this.container.register({
      appConfigs: asValue(appConfig),
      gameSettings: asValue(gameSettings),
      rateConfigs: asValue(rateConfigs),
    });
  }

  registerModels() {
    this.container.register({
      eventDetailsRepository: asValue(EventDetailModel),
      eventRepository: asValue(EventModel),
      roundRepository: asValue(RoundModel),
      gameConfigRepository: asValue(GameConfigModel),
    });
  }

  registerServices() {
    this.container.register({
      logService: asValue(logger),
      roundGeneratorService: asClass(RoundGeneratorService).singleton(),
      roundService: asClass(RoundService).singleton(),
      eventService: asClass(EventService).singleton(),
      gameConfigService: asClass(GameConfigService).singleton(),
    });
  }

  registerCrons() {
    this.container.register({
      gameCron: asClass(GameCron).singleton(),
      gameStateManager: asClass(GameStateManager).singleton(),
      timelineProcessor: asClass(TimelineProcessor).singleton(),
      roundScheduler: asClass(RoundScheduler).singleton(),
    });
  }
}
