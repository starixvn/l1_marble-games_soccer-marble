import { App, ContainerRegistry } from "@soccer-marble/soccer-marble-base";
import appConfigs from "./game-config.json" with { type: "json" };
import gameSettings from "./game-settings.json" with { type: "json" };
import rateConfigs from "./rate-configs.json" with { type: "json" };

const run = async () => {
  const container = new ContainerRegistry(appConfigs, gameSettings, rateConfigs).register();
  const app = new App(container);
  await app.run();
};

run().catch((error) => {
  console.error("App running error:", error);
  process.exit(1);
});
