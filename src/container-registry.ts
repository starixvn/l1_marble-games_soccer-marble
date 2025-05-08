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

export class ContainerRegistry {
  container: AwilixContainer<AppContainer>;

  constructor() {
    this.container = createContainer<AppContainer>({
      injectionMode: InjectionMode.PROXY,
    });
  }

  register() {
    this.container.register({
      appConfigs: asValue(appConfig),
      logService: asValue(logger),
      gameSettings: asValue(gameSettings),
      rateConfigs: asValue(rateConfigs),
      gameCron: asClass(GameCron).singleton(),
      eventDetailsRepository: asValue(EventDetailModel),
      eventRepository: asValue(EventModel),
      roundRepository: asValue(RoundModel),
      gameConfigRepository: asValue(GameConfigModel),
      roundGeneratorService: asClass(RoundGeneratorService).singleton(),
      roundService: asClass(RoundService).singleton(),
      eventService: asClass(EventService).singleton(),
      gameConfigService: asClass(GameConfigService).singleton(),
    });

    return this.container;
  }
}
