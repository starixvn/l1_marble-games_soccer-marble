import { RoundService } from "../../../src/services/round-service";
import { IRound } from "../../../src/models/rounds";
import { IEventDetail } from "../../../src/models/event-details";
import { mockContainer } from "../global-stubs";

describe("RoundService", () => {
  let service: RoundService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoundService(mockContainer);
  });

  describe("initializeRoundId", () => {
    it("should return last round id when a round exists", async () => {
      // Arrange
      const mockRound = {
        roundId: 42,
      };
      (mockContainer.roundRepository.findOne as jest.Mock).mockResolvedValue(mockRound);

      // Act
      const result = await service.initializeRoundId();

      // Assert
      expect(mockContainer.roundRepository.findOne).toHaveBeenCalledWith(
        { gameId: mockContainer.gameSettings.gameId },
        "roundId",
        {
          sort: { roundId: -1 },
        }
      );
      expect(result).toBe(42);
    });

    it("should return 0 when no rounds exist", async () => {
      // Arrange
      (mockContainer.roundRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.initializeRoundId();

      // Assert
      expect(mockContainer.roundRepository.findOne).toHaveBeenCalledWith(
        { gameId: mockContainer.gameSettings.gameId },
        "roundId",
        {
          sort: { roundId: -1 },
        }
      );
      expect(result).toBe(0);
    });
  });

  describe("markRoundAsEnded", () => {
    it("should update round as ended", async () => {
      // Arrange
      const roundId = 42;
      (mockContainer.roundRepository.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      // Act
      await service.markRoundAsEnded(roundId);

      // Assert
      expect(mockContainer.roundRepository.updateOne).toHaveBeenCalledWith(
        { roundId, gameId: mockContainer.gameSettings.gameId },
        { $set: { ended: true } }
      );
    });
  });

  describe("insertRound", () => {
    it("should create a new round", async () => {
      // Arrange
      const round: Partial<IRound> = {
        roundId: 42,
        gameId: mockContainer.gameSettings.gameId,
        eventID: 123,
        ended: false,
      };

      (mockContainer.roundRepository.create as jest.Mock).mockResolvedValue(round);

      // Act
      await service.insertRound(round as IRound);

      // Assert
      expect(mockContainer.roundRepository.create).toHaveBeenCalledWith(round);
    });
  });

  describe("updateRound", () => {
    it("should update an existing round", async () => {
      // Arrange
      const round: Partial<IRound> = {
        roundId: 42,
        gameId: mockContainer.gameSettings.gameId,
        eventID: 123,
        ended: false,
      };

      (mockContainer.roundRepository.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      // Act
      await service.updateRound(round as IRound);

      // Assert
      expect(mockContainer.roundRepository.updateOne).toHaveBeenCalledWith(
        { roundId: round.roundId, gameId: mockContainer.gameSettings.gameId },
        { $set: round }
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
          hasResults: true,
          result: {
            goalSequence: "H",
            finalScore: "2-1",
          },
        },
      ];

      (mockContainer.roundRepository.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      // Act
      await service.updateRoundEventDetailResult(roundId, eventDetails as IEventDetail[]);

      // Assert
      expect(mockContainer.roundRepository.updateOne).toHaveBeenCalledWith(
        { roundId, gameId: mockContainer.gameSettings.gameId },
        { $set: { eventDetails } }
      );
    });
  });

  describe("fetchRoundData", () => {
    it("should fetch round data by ID", async () => {
      // Arrange
      const mockRound = {
        roundId: 123,
        eventID: 456,
        encryptedResult: "encrypted_result",
        encryptedSettlementResult: "encrypted_settlement",
        encryptedSelections: "encrypted_selections",
      };

      (mockContainer.roundRepository.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRound),
        }),
      });

      // Act
      const result = await service.fetchRoundData(123);

      // Assert
      expect(mockContainer.roundRepository.findOne).toHaveBeenCalledWith({
        roundId: 123,
        gameId: mockContainer.gameSettings.gameId,
      });
      expect(result).toEqual(mockRound);
    });

    it("should throw error if round not found", async () => {
      // Arrange
      (mockContainer.roundRepository.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(service.fetchRoundData(123)).rejects.toThrow("Round not found for roundId 123");
      expect(mockContainer.logService.logError).toHaveBeenCalled();
    });
  });
});
