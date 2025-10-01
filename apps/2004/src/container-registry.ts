import { ContainerRegistry as BaseContainerRegistry } from "@soccer-marble/soccer-marble-base";
import { asClass } from "awilix";
import { RoundGeneratorService } from "./services/round-generator-service";
import { ResultGeneratorService } from "./services/result-generator-service";
import { OddsGeneratorService } from "./services/odds-generator-service";

export class ContainerRegistry extends BaseContainerRegistry {
  override registerServices() {
    super.registerServices();

    this.container.register({
      roundGeneratorService: asClass(RoundGeneratorService).singleton(),
      resultGeneratorService: asClass(ResultGeneratorService).singleton(),
      oddsGeneratorService: asClass(OddsGeneratorService).singleton(),
    });
  }
}
