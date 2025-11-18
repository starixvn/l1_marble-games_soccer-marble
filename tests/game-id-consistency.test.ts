import * as fs from "fs";
import * as path from "path";

describe("GameId Consistency Tests - All Games", () => {
  const appsDir = path.resolve(__dirname, "../apps");
  const excludeGameIds = [2001];

  // Dynamically discover all game directories
  const gameDirectories = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => /^\d{4}$/.test(name)) // Only directories with 4-digit names
    .filter((name) => !excludeGameIds.includes(parseInt(name)))
    .sort();

  console.log(`Found ${gameDirectories.length} game directories: ${gameDirectories.join(", ")}`);

  gameDirectories.forEach((gameIdStr) => {
    const expectedGameId = parseInt(gameIdStr);
    const gameDir = path.join(appsDir, gameIdStr);

    describe(`apps/${expectedGameId} - GameId Consistency`, () => {
      it("should have valid gameId extracted from directory name", () => {
        expect(Number.isInteger(expectedGameId)).toBe(true);
      });

      describe("Environment Config Files (config/)", () => {
        const configDir = path.join(gameDir, "config");
        const configFiles = ["game-config.LOCAL.json", "game-config.UAT.json", "game-config.KLPROD.json"];

        configFiles.forEach((configFile) => {
          describe(configFile, () => {
            let config: any;
            let configExists: boolean;

            beforeAll(() => {
              const configPath = path.join(configDir, configFile);
              configExists = fs.existsSync(configPath);
              if (configExists) {
                const configContent = fs.readFileSync(configPath, "utf-8");
                config = JSON.parse(configContent);
              }
            });

            it(`should exist`, () => {
              expect(configExists).toBe(true);
            });

            it(`should have gameId matching directory name (${expectedGameId})`, () => {
              if (configExists) {
                expect(config.gameId).toBe(expectedGameId);
              }
            });

            it(`should have agenda.collectionName containing gameId (${expectedGameId})`, () => {
              if (configExists && config.agenda && config.agenda.collectionName) {
                expect(config.agenda.collectionName).toContain(expectedGameId.toString());
                expect(config.agenda.collectionName).toMatch(new RegExp(`soccer_marble_${expectedGameId}_jobs`));
              }
            });
          });
        });
      });

      describe("Source Config Files (src/)", () => {
        const srcDir = path.join(gameDir, "src");

        describe("game-config.json", () => {
          let gameConfig: any;
          let configExists: boolean;

          beforeAll(() => {
            const configPath = path.join(srcDir, "game-config.json");
            configExists = fs.existsSync(configPath);
            if (configExists) {
              const configContent = fs.readFileSync(configPath, "utf-8");
              gameConfig = JSON.parse(configContent);
            }
          });

          it(`should exist`, () => {
            expect(configExists).toBe(true);
          });

          it(`should have gameId matching directory name (${expectedGameId})`, () => {
            if (configExists) {
              expect(gameConfig.gameId).toBe(expectedGameId);
            }
          });

          it(`should have agenda.collectionName containing gameId (${expectedGameId})`, () => {
            if (configExists && gameConfig.agenda && gameConfig.agenda.collectionName) {
              expect(gameConfig.agenda.collectionName).toContain(expectedGameId.toString());
              expect(gameConfig.agenda.collectionName).toMatch(new RegExp(`soccer_marble_${expectedGameId}_jobs`));
            }
          });
        });

        describe("game-settings.json", () => {
          let gameSettings: any;
          let settingsExists: boolean;

          beforeAll(() => {
            const settingsPath = path.join(srcDir, "game-settings.json");
            settingsExists = fs.existsSync(settingsPath);
            if (settingsExists) {
              const settingsContent = fs.readFileSync(settingsPath, "utf-8");
              gameSettings = JSON.parse(settingsContent);
            }
          });

          it(`should exist`, () => {
            expect(settingsExists).toBe(true);
          });

          it(`should have gameId matching directory name (${expectedGameId})`, () => {
            if (settingsExists) {
              expect(gameSettings.gameId).toBe(expectedGameId);
            }
          });

          it(`should have modelPrefix containing gameId (${expectedGameId})`, () => {
            if (settingsExists && gameSettings.modelPrefix) {
              expect(gameSettings.modelPrefix).toContain(expectedGameId.toString());
              expect(gameSettings.modelPrefix).toMatch(new RegExp(`soccer_marble_${expectedGameId}`));
            }
          });
        });
      });
    });
  });
});
