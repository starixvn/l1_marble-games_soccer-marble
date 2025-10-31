const fs = require("fs");

const globalConfigPath = "configs/game-config.json";
const gameConfigPath = "game-config.json";

if (fs.existsSync(globalConfigPath) && fs.existsSync(gameConfigPath)) {
  console.log("Merge global configs");

  const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, "utf-8"));
  const gameConfig = JSON.parse(fs.readFileSync(gameConfigPath, "utf-8"));
  const merged = Object.assign({}, JSON.parse(globalConfig), JSON.parse(gameConfig));
  const mergedConfigPath = `apps/${gameConfig.gameId}/game-config.json`;

  fs.writeFileSync(mergedConfigPath, JSON.stringify(merged, null, 2));
} else if (fs.existsSync(gameConfigPath)) {
  console.log("Copy game config");

  const gameConfig = JSON.parse(fs.readFileSync(gameConfigPath, "utf-8"));
  const mergedConfigPath = `apps/${gameConfig.gameId}/game-config.json`;

  fs.writeFileSync(mergedConfigPath, JSON.stringify(gameConfig, null, 2));
}
