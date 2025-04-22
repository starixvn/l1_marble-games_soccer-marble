import { AppContainer } from "./types/index";
import { createContainer, AwilixContainer, InjectionMode, asValue } from "awilix";
import { gameSettings } from "./config/game-settings";
import { rateConfigs } from "./config/rate-config";
import { logger } from "sc-common";

export class Container {
  private container: AwilixContainer;
  logService: typeof logger = null as any;

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
    });
  }
}
