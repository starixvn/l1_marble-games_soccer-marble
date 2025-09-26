import { ContainerRegistry as BaseContainerRegistry } from "@soccer-marble/soccer-marble-base";
import { RoundModel } from "./model";
import { asValue, asClass } from "awilix";
import { RoundGeneratorService } from "./services/round-generator-service";
import { EventService } from "./services/event-service";
import { ResultGeneratorService } from "./services/result-generator-service";
import { OddsGeneratorService } from "./services/odds-generator-service";

export class ContainerRegistry extends BaseContainerRegistry {
  override registerGameModels() {
    this.container.register({
      roundRepository: asValue(RoundModel as any),
    });
  }

  override registerServices() {
    super.registerServices();

    this.container.register({
      roundGeneratorService: asClass(RoundGeneratorService).singleton(),
      eventService: asClass(EventService).singleton(),
      resultGeneratorService: asClass(ResultGeneratorService).singleton(),
      oddsGeneratorService: asClass(OddsGeneratorService).singleton(),
    });
  }
}
