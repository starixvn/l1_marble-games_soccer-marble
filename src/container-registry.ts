import { AppContainer } from "./types/index";
import { createContainer, AwilixContainer, InjectionMode, asValue, asClass } from "awilix";
import { gameSettings } from "./config/game-settings";
import { rateConfigs } from "./config/rate-config";
import { logger } from "sc-common";
import { GameCron } from "./crons/game-cron";
import { EventDetailModel, EventModel, RoundModel } from "./models";

export class Container {
  container: AwilixContainer;

  constructor() {
    this.container = createContainer<AppContainer>({
      injectionMode: InjectionMode.PROXY,
    });
  }

  register() {
    this.container.register({
      logService: asValue(logger),
      gameSettings: asValue(gameSettings),
      rateConfigs: asValue(rateConfigs),
      gameCron: asClass(GameCron).singleton(),
      eventDetailsRepository: asValue(EventDetailModel),
      eventRepository: asValue(EventModel),
      roundRepository: asValue(RoundModel),
    });
  }
}
