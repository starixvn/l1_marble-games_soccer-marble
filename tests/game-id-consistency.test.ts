import * as fs from "fs";
import * as path from "path";

describe("GameId Consistency Tests - All Games", () => {
  const appsDir = path.resolve(__dirname, "../apps");

  // Dynamically discover all game directories
  const gameDirectories = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => /^\d{4}$/.test(name)) // Only directories with 4-digit names
    .sort();

  if (gameDirectories.length === 0) {
    throw new Error("No game directories found in apps/");
  }

  console.log(`Found ${gameDirectories.length} game directories: ${gameDirectories.join(", ")}`);

  gameDirectories.forEach((gameIdStr) => {
    const expectedGameId = parseInt(gameIdStr);
    const gameDir = path.join(appsDir, gameIdStr);

    describe(`apps/${expectedGameId} - GameId Consistency`, () => {
      it("should have valid gameId extracted from directory name", () => {
        expect(expectedGameId).toBeGreaterThanOrEqual(2000);
        expect(expectedGameId).toBeLessThanOrEqual(9999);
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

      describe("Cross-File Consistency", () => {
        let allConfigs: { file: string; config: any }[] = [];

        beforeAll(() => {
          const configDir = path.join(gameDir, "config");
          const srcDir = path.join(gameDir, "src");

          // Load all config files that exist
          const configFiles = [
            { dir: configDir, file: "game-config.LOCAL.json" },
            { dir: configDir, file: "game-config.UAT.json" },
            { dir: configDir, file: "game-config.KLPROD.json" },
            { dir: srcDir, file: "game-config.json" },
            { dir: srcDir, file: "game-settings.json" },
          ];

          allConfigs = configFiles
            .filter(({ dir, file }) => fs.existsSync(path.join(dir, file)))
            .map(({ dir, file }) => {
              const filePath = path.join(dir, file);
              const content = fs.readFileSync(filePath, "utf-8");
              return { file, config: JSON.parse(content) };
            });
        });

        it("should have at least one config file", () => {
          expect(allConfigs.length).toBeGreaterThan(0);
        });

        it("should have consistent gameId across all config files", () => {
          if (allConfigs.length > 0) {
            const gameIds = allConfigs.map((c) => c.config.gameId);
            const uniqueGameIds = [...new Set(gameIds)];

            expect(uniqueGameIds).toHaveLength(1);
            expect(uniqueGameIds[0]).toBe(expectedGameId);
          }
        });

        it("should have consistent gameId in all collection names", () => {
          const configsWithAgenda = allConfigs.filter((c) => c.config.agenda && c.config.agenda.collectionName);

          configsWithAgenda.forEach(({ file, config }) => {
            const collectionName = config.agenda.collectionName;
            const regex = new RegExp(`soccer_marble_(\\d+)_jobs`);
            const match = collectionName.match(regex);

            expect(match).not.toBeNull();
            if (match) {
              expect(parseInt(match[1])).toBe(expectedGameId);
            }
          });
        });

        it("should have consistent gameId in modelPrefix", () => {
          const configsWithModelPrefix = allConfigs.filter((c) => c.config.modelPrefix);

          configsWithModelPrefix.forEach(({ file, config }) => {
            const modelPrefix = config.modelPrefix;
            const regex = new RegExp(`soccer_marble_(\\d+)`);
            const match = modelPrefix.match(regex);

            expect(match).not.toBeNull();
            if (match) {
              expect(parseInt(match[1])).toBe(expectedGameId);
            }
          });
        });
      });
    });
  });
});
