import { GameData } from "../../../src/crons/game-data";
import { mockContainer } from "../global-stubs";
import { GameConfig } from "../../../src/types";

describe("GameData", () => {
  let gameData: GameData;
  let mockGameConfigService: any;
  let mockLogService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { gameConfigService, logService } = mockContainer;
    mockGameConfigService = gameConfigService;
    mockLogService = logService;
    gameData = new GameData(mockContainer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with container dependencies", () => {
      // Assert
      expect(gameData).toBeInstanceOf(GameData);
      expect(gameData.gameConfig).toBeNull();
    });
  });

  describe("loadGameConfig", () => {
    it("should load existing game config when available", async () => {
      // Arrange
      const mockGameConfig: GameConfig = {
        gameId: 2001,
        config: {
          enabled: true,
          teamSelectionMode: 1,
          teams: ["Team A", "Team B"],
          matches: [],
          numberOfVideos: { H: 5, A: 3 },
        },
      };

      mockGameConfigService.getGameConfig.mockResolvedValue(mockGameConfig);

      // Act
      await gameData.loadGameConfig();

      // Assert
      expect(mockGameConfigService.getGameConfig).toHaveBeenCalled();
      expect(gameData.gameConfig).toEqual(mockGameConfig);
      expect(mockLogService.logError).not.toHaveBeenCalled();
      expect(mockGameConfigService.createNewGameConfig).not.toHaveBeenCalled();
    });

    it("should create new game config when none exists", async () => {
      // Arrange
      const mockNewGameConfig: GameConfig = {
        gameId: 2001,
        config: {
          enabled: false,
          teamSelectionMode: 1,
          teams: [],
          matches: [],
          numberOfVideos: {},
        },
      };

      mockGameConfigService.getGameConfig.mockResolvedValue(null);
      mockGameConfigService.createNewGameConfig.mockResolvedValue(mockNewGameConfig);

      // Act
      await gameData.loadGameConfig();

      // Assert
      expect(mockGameConfigService.getGameConfig).toHaveBeenCalled();
      expect(mockLogService.logError).toHaveBeenCalledWith("Game config not found, creating new game config");
      expect(mockGameConfigService.createNewGameConfig).toHaveBeenCalled();
      expect(gameData.gameConfig).toEqual(mockNewGameConfig);
    });

    it("should handle undefined game config", async () => {
      // Arrange
      const mockNewGameConfig: GameConfig = {
        gameId: 2001,
        config: {
          enabled: false,
          teamSelectionMode: 1,
          teams: [],
          matches: [],
          numberOfVideos: {},
        },
      };

      mockGameConfigService.getGameConfig.mockResolvedValue(undefined);
      mockGameConfigService.createNewGameConfig.mockResolvedValue(mockNewGameConfig);

      // Act
      await gameData.loadGameConfig();

      // Assert
      expect(mockGameConfigService.getGameConfig).toHaveBeenCalled();
      expect(mockLogService.logError).toHaveBeenCalledWith("Game config not found, creating new game config");
      expect(mockGameConfigService.createNewGameConfig).toHaveBeenCalled();
      expect(gameData.gameConfig).toEqual(mockNewGameConfig);
    });

    it("should replace existing game config with new one when reloading", async () => {
      // Arrange
      const existingConfig: GameConfig = {
        gameId: 2001,
        config: {
          enabled: true,
          teamSelectionMode: 2,
          teams: ["Team C", "Team D"],
          matches: [{ homeTeam: "Team C", awayTeam: "Team D", theme: "2001" }],
          numberOfVideos: { H: 10, A: 8 },
        },
      };

      const newConfig: GameConfig = {
        gameId: 2001,
        config: {
          enabled: false,
          teamSelectionMode: 1,
          teams: [],
          matches: [],
          numberOfVideos: {},
        },
      };

      // Set initial config
      gameData.gameConfig = existingConfig;

      mockGameConfigService.getGameConfig.mockResolvedValue(newConfig);

      // Act
      await gameData.loadGameConfig();

      // Assert
      expect(mockGameConfigService.getGameConfig).toHaveBeenCalled();
      expect(gameData.gameConfig).toEqual(newConfig);
      expect(gameData.gameConfig).not.toEqual(existingConfig);
    });

    it("should handle complex game config with all properties", async () => {
      // Arrange
      const complexGameConfig: GameConfig = {
        gameId: 2001,
        config: {
          enabled: true,
          teamSelectionMode: 2,
          teams: [
            "clb_rma",
            "clb_mci",
            "clb_fcb",
            "clb_psg",
            "clb_che",
            "clb_int",
            "clb_juv",
            "clb_atm",
            "clb_bvb",
            "clb_ben",
            "clb_por",
            "clb_fla",
          ],
          matches: [
            { homeTeam: "clb_rma", awayTeam: "clb_mci", theme: "2001" },
            { homeTeam: "clb_fcb", awayTeam: "clb_psg", theme: "2001" },
            { homeTeam: "clb_che", awayTeam: "clb_int", theme: "2001" },
          ],
          numberOfVideos: {
            AAAA: 2,
            AAAH: 6,
            AAA: 2,
            AAHA: 2,
            AAHH: 2,
            AAH: 2,
            AA: 2,
            AHAA: 3,
            AHAH: 3,
            AHA: 2,
            AHHA: 4,
            AHHH: 5,
            AHH: 2,
            AH: 15,
            A: 15,
            HAAA: 2,
            HAAH: 2,
            HAA: 11,
            HAHA: 2,
            HAHH: 2,
            HAH: 12,
            HA: 2,
            HHAA: 2,
            HHAH: 3,
            HHA: 8,
            HHHA: 2,
            HHHH: 2,
            HHH: 2,
            HH: 4,
            H: 19,
          },
        },
      };

      mockGameConfigService.getGameConfig.mockResolvedValue(complexGameConfig);

      // Act
      await gameData.loadGameConfig();

      // Assert
      expect(mockGameConfigService.getGameConfig).toHaveBeenCalled();
      expect(gameData.gameConfig).toEqual(complexGameConfig);
      expect(gameData.gameConfig?.config.enabled).toBe(true);
      expect(gameData.gameConfig?.config.teamSelectionMode).toBe(2);
      expect(gameData.gameConfig?.config.teams).toHaveLength(12);
      expect(gameData.gameConfig?.config.matches).toHaveLength(3);
      expect(Object.keys(gameData.gameConfig?.config.numberOfVideos || {})).toHaveLength(30);
    });
  });
});
