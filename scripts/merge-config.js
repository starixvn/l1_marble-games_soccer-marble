const fs = require("fs");

const globalConfigPath = "configs/game-config.json";
const gameConfigPath = "game-config.json";

if (fs.existsSync(globalConfigPath) && fs.existsSync(gameConfigPath)) {
  console.log("Merge global configs");

  const globalConfig = fs.readFileSync(globalConfigPath, "utf-8");
  const gameConfig = fs.readFileSync(gameConfigPath, "utf-8");
  const merged = Object.assign({}, JSON.parse(globalConfig), JSON.parse(gameConfig));

  fs.writeFileSync(gameConfigPath, JSON.stringify(merged, null, 2));
}
