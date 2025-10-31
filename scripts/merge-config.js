const fs = require("fs");

const globalConfigPath = "configs/game-config.json";
const gameConfigPath = "game-config.json";

function writeGameConfigFile(gameConfig) {
  const path = `apps/${gameConfig.gameId}/dist/game-config.json`;

  fs.writeFileSync(path, JSON.stringify(gameConfig, null, 2));
}

if (fs.existsSync(globalConfigPath) && fs.existsSync(gameConfigPath)) {
  console.log("Merge global configs");

  const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, "utf-8"));
  const gameConfig = JSON.parse(fs.readFileSync(gameConfigPath, "utf-8"));
  const merged = Object.assign({}, globalConfig, gameConfig);

  writeGameConfigFile(merged);
} else if (fs.existsSync(gameConfigPath)) {
  console.log("Copy game config");

  const gameConfig = JSON.parse(fs.readFileSync(gameConfigPath, "utf-8"));

  writeGameConfigFile(gameConfig);
}
