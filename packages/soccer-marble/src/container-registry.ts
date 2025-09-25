import { AppContainer } from "./types/index";
import { createContainer, AwilixContainer, InjectionMode, asValue, asClass } from "awilix";
import { logger } from "sc-common";
import { EventDetailModel, EventModel, GameConfigModel } from "./models";
import { createRoundModel } from "./models/rounds";
import { RoundGeneratorService } from "./services/round-generator-service";
import { RoundService } from "./services/round-service";
import { EventService } from "./services/event-service";
import { GameConfigService } from "./services/game-config-service";
import { GameHandler } from "./crons/game-handler";
import { Consumer } from "./crons/consumer";
import { Scheduler } from "./crons/scheduler";
import { GameData } from "./crons/game-data";
import { ResultGeneratorService } from "./services/result-generator-service";
import { OddsGeneratorService } from "./services/odds-generator-service";
import { Configuration } from "./configuration";

export class ContainerRegistry {
  container: AwilixContainer<AppContainer>;
  protected readonly appConfigs: any;
  protected readonly gameSettings: any;
  protected readonly rateConfigs: any;

  constructor(appConfigs: any, gameSettings: any, rateConfigs: any) {
    this.appConfigs = appConfigs;
    this.gameSettings = gameSettings;
    this.rateConfigs = rateConfigs;

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
      appConfigs: asValue(this.appConfigs),
      gameSettings: asValue(this.gameSettings),
      rateConfigs: asValue(this.rateConfigs),
      configuration: asClass(Configuration).singleton(),
    });
  }

  registerModels() {
    const roundModel = createRoundModel(this.gameSettings);

    this.container.register({
      eventDetailsRepository: asValue(EventDetailModel),
      eventRepository: asValue(EventModel),
      roundRepository: asValue(roundModel),
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
      resultGeneratorService: asClass(ResultGeneratorService).singleton(),
      oddsGeneratorService: asClass(OddsGeneratorService).singleton(),
    });
  }

  registerCrons() {
    this.container.register({
      gameHandler: asClass(GameHandler).singleton(),
      scheduler: asClass(Scheduler).singleton(),
      consumer: asClass(Consumer).singleton(),
      gameData: asClass(GameData).singleton(),
    });
  }
}
