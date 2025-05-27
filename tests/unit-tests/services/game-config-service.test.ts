import { GameConfigService } from "../../../src/services/game-config-service";
import { mockContainer } from "../global-stubs";
import mongoose from "mongoose";

jest.mock("../../../src/models");

describe("GameConfigService", () => {
  let gameConfigService: GameConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    gameConfigService = new GameConfigService(mockContainer);
  });

  describe("getGameConfig", () => {
    it("should fetch game config", async () => {
      // Arrange
      const mockGameConfig = {
        _id: new mongoose.Types.ObjectId(),
        gameId: 1,
        enabled: true,
      };
      (mockContainer.gameConfigRepository.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGameConfig),
        }),
      });

      // Act
      const result = await gameConfigService.getGameConfig();

      // Assert
      expect(mockContainer.gameConfigRepository.findOne).toHaveBeenCalledWith({
        gameId: mockContainer.gameSettings.gameId,
      });
      expect(result).toEqual(mockGameConfig);
    });

    it("should return null if game config not found", async () => {
      // Arrange
      (mockContainer.gameConfigRepository.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act
      const result = await gameConfigService.getGameConfig();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("setGameEnabled", () => {
    it("should update game enabled status", async () => {
      // Arrange
      const mockGameConfig = {
        _id: new mongoose.Types.ObjectId(),
        gameId: 1,
        enabled: true,
      };

      (mockContainer.gameConfigRepository.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGameConfig),
        }),
      });

      // Act
      await gameConfigService.setGameEnabled(true);

      // Assert
      expect(mockContainer.gameConfigRepository.findOneAndUpdate).toHaveBeenCalledWith(
        {
          gameId: mockContainer.gameSettings.gameId,
        },
        { enabled: true },
        { new: true, upsert: true }
      );

      expect(mockContainer.logService.log).toHaveBeenCalledWith("Game Configs: set game enabled to true", "info");
    });
  });
});
