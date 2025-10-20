import { App } from "@soccer-marble/soccer-marble-base";
import { ContainerRegistry } from "@soccer-marble/soccer-marble-live";
import appConfigs from "./game-config.json" assert { type: "json" };
import gameSettings from "./game-settings.json" assert { type: "json" };
import rateConfigs from "./rate-configs.json" assert { type: "json" };

const run = async () => {
  const container = new ContainerRegistry(appConfigs, gameSettings, rateConfigs).register();
  const app = new App(container);
  await app.run();
};

run().catch((error) => {
  console.error("App running error:", error);
  process.exit(1);
});
