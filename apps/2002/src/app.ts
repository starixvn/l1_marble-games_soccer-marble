import { ContainerRegistry } from "@soccer-marble/soccer-marble-base";
import { App } from "@soccer-marble/soccer-marble-base";
import { appConfigs, gameSettings, rateConfigs } from "./game-config";

const run = async () => {
  const container = new ContainerRegistry(appConfigs, gameSettings, rateConfigs).register();
  const app = new App(container);
  await app.run();
};

run().catch((error) => {
  console.error("App running error:", error);
  process.exit(1);
});
