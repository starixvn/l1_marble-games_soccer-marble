import { RoundService } from "../../../src/services/round-service";
import { RoundModel } from "../../../src/models";
import { IRound } from "../../../src/models/rounds";
import { IEventDetail } from "../../../src/models/event-details";
import mongoose from "mongoose";

jest.mock("../../../src/models/rounds", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  },
}));

describe("RoundService", () => {
  let service: RoundService;
  let container: any;
  let mockRoundModel: jest.Mocked<typeof RoundModel>;
  
  beforeEach(() => {
    // Arrange
    mockRoundModel = RoundModel as unknown as jest.Mocked<typeof RoundModel>;
    
    container = {
      roundRepository: mockRoundModel,
      gameSettings: {
        gameId: 123,
      },
    };
    
    service = new RoundService(container);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe("initializeRoundId", () => {
    it("should return last round id when a round exists", async () => {
      // Arrange
      const mockRound = {
        roundId: 42,
      };
      
      mockRoundModel.findOne = jest.fn().mockResolvedValue(mockRound);
      
      // Act
      const result = await service.initializeRoundId();
      
      // Assert
      expect(mockRoundModel.findOne).toHaveBeenCalledWith(
        { gameId: container.gameSettings.gameId }, 
        "roundId", 
        { sort: { roundId: -1 } }
      );
      expect(result).toBe(42);
    });

    it("should return 0 when no rounds exist", async () => {
      // Arrange
      mockRoundModel.findOne = jest.fn().mockResolvedValue(null);
      
      // Act
      const result = await service.initializeRoundId();
      
      // Assert
      expect(mockRoundModel.findOne).toHaveBeenCalledWith(
        { gameId: container.gameSettings.gameId }, 
        "roundId", 
        { sort: { roundId: -1 } }
      );
      expect(result).toBe(0);
    });
  });

  describe("fetchLastRound", () => {
    it("should fetch a round by id", async () => {
      // Arrange
      const roundId = 42;
      const mockRound: Partial<IRound> = {
        roundId,
        gameId: container.gameSettings.gameId,
        eventID: 123,
      };
      
      const mockLean = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRound),
      });
      
      mockRoundModel.findOne = jest.fn().mockReturnValue({
        lean: mockLean,
      });
      
      // Act
      const result = await service.fetchLastRound(roundId);
      
      // Assert
      expect(mockRoundModel.findOne).toHaveBeenCalledWith({ 
        gameId: container.gameSettings.gameId, 
        roundId,
      });
      expect(result).toEqual(mockRound);
    });

    it("should return null when no round found", async () => {
      // Arrange
      const roundId = 42;
      
      const mockLean = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      
      mockRoundModel.findOne = jest.fn().mockReturnValue({
        lean: mockLean,
      });
      
      // Act
      const result = await service.fetchLastRound(roundId);
      
      // Assert
      expect(mockRoundModel.findOne).toHaveBeenCalledWith({ 
        gameId: container.gameSettings.gameId, 
        roundId,
      });
      expect(result).toBeNull();
    });
  });

  describe("markRoundAsEnded", () => {
    it("should update round as ended", async () => {
      // Arrange
      const roundId = 42;
      mockRoundModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await service.markRoundAsEnded(roundId);
      
      // Assert
      expect(mockRoundModel.updateOne).toHaveBeenCalledWith(
        { roundId, gameId: container.gameSettings.gameId },
        { $set: { ended: true } }
      );
    });
  });

  describe("insertOrUpdateRound", () => {
    it("should upsert a round", async () => {
      // Arrange
      const round: Partial<IRound> = {
        _id: new mongoose.Types.ObjectId() as any,
        roundId: 42,
        gameId: container.gameSettings.gameId,
        eventID: 123,
        ended: false,
      };
      
      mockRoundModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await service.insertOrUpdateRound(round as IRound);
      
      // Assert
      expect(mockRoundModel.updateOne).toHaveBeenCalledWith(
        { roundId: round.roundId, gameId: container.gameSettings.gameId },
        { $set: round },
        { upsert: true }
      );
    });
  });

  describe("updateRoundEventDetailResult", () => {
    it("should update event details for a round", async () => {
      // Arrange
      const roundId = 42;
      const eventDetails: Partial<IEventDetail>[] = [
        {
          eventID: 123,
          hasResult: true,
          result: { 
            goalSequence: "H",
            finalScore: "2-1" 
          },
        },
      ];
      
      mockRoundModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await service.updateRoundEventDetailResult(roundId, eventDetails as IEventDetail[]);
      
      // Assert
      expect(mockRoundModel.updateOne).toHaveBeenCalledWith(
        { roundId, gameId: container.gameSettings.gameId },
        { $set: { eventDetails } }
      );
    });
  });
});
