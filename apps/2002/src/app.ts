import { App, ContainerRegistry } from "@soccer-marble/soccer-marble-base";
import { appConfigs } from "./game-config";
import { gameSettings } from "./game-settings";
import { rateConfigs } from "./rate-configs";

const run = async () => {
  const container = new ContainerRegistry(appConfigs, gameSettings, rateConfigs).register();
  const app = new App(container);
  await app.run();
};

run().catch((error) => {
  console.error("App running error:", error);
  process.exit(1);
});
