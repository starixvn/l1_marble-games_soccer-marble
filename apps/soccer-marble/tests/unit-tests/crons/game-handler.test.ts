import { GameHandler } from "../../../src/crons/game-handler";
import { mockContainer } from "../global-stubs";
import { GameRunningRound, SettlementStatus } from "../../../src/types";
import { decrypt } from "@soccer-marble/shared-utils";
import { IEventDetail } from "../../../src/models/event-details";
import mongoose from "mongoose";

jest.mock("@soccer-marble/shared-utils");

describe("GameHandler", () => {
  let gameHandler: GameHandler;
  let mockRoundService: any;
  let mockEventService: any;
  let mockRoundGeneratorService: any;
  let mockLogService: any;
  let mockGameData: any;
  let mockScheduler: any;
  let mockGameSettings: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { roundService, eventService, roundGeneratorService, logService, gameData, scheduler, gameSettings } =
      mockContainer;
    mockRoundService = roundService;
    mockEventService = eventService;
    mockRoundGeneratorService = roundGeneratorService;
    mockLogService = logService;
    mockGameData = gameData;
    mockScheduler = scheduler;
    mockGameSettings = gameSettings;
    gameHandler = new GameHandler(mockContainer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with container dependencies", () => {
      // Assert
      expect(gameHandler).toBeInstanceOf(GameHandler);
    });
  });

  describe("loadRoundFromRoundId", () => {
    it("should load and decrypt round data", async () => {
      // Arrange
      const roundId = 123;
      const mockRound = {
        roundId: 123,
        encryptedResult: "encrypted_result",
        encryptedSettlementResult: "encrypted_settlement",
        encryptedSelections: "encrypted_selections",
      };
      const decryptedResult = { drawResults: [{ playlist: "video1" }] };
      const decryptedSettlement = [{ ft_hdp_home: SettlementStatus.WIN }];
      const decryptedSelections = [{ ft_hdp_home: { name: "ft_hdp_home", price: 1.8 } }];

      mockRoundService.fetchRoundData.mockResolvedValue(mockRound);
      (decrypt as jest.MockedFunction<typeof decrypt>)
        .mockReturnValueOnce(decryptedResult)
        .mockReturnValueOnce(decryptedSettlement)
        .mockReturnValueOnce(decryptedSelections);

      // Act
      const result = await gameHandler.loadRoundFromRoundId(roundId);

      // Assert
      expect(mockRoundService.fetchRoundData).toHaveBeenCalledWith(roundId);
      expect(decrypt).toHaveBeenCalledWith("encrypted_result");
      expect(decrypt).toHaveBeenCalledWith("encrypted_settlement");
      expect(decrypt).toHaveBeenCalledWith("encrypted_selections");
      expect(result).toEqual({
        ...mockRound,
        roundTime: 1,
        result: decryptedResult,
        settlementResult: decryptedSettlement,
        selections: decryptedSelections,
      });
    });
  });

  describe("loadEventDetailsFromEventId", () => {
    it("should load event details for valid event", async () => {
      // Arrange
      const eventId = 12345;
      const mockEvent = {
        eventID: 12345,
        eventDetails: ["detail1", "detail2"],
      };
      const mockEventDetails = [
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
          eventID: 12345,
          oddsAvailableTs: new Date(),
          scheduleStartTs: new Date(),
          resultsAvailableTs: new Date(),
          hasResults: false,
        },
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
          eventID: 12345,
          oddsAvailableTs: new Date(),
          scheduleStartTs: new Date(),
          resultsAvailableTs: new Date(),
          hasResults: false,
        },
      ] as any;

      mockEventService.fetchEvent.mockResolvedValue(mockEvent);
      mockEventService.fetchEventDetail
        .mockResolvedValueOnce(mockEventDetails[0])
        .mockResolvedValueOnce(mockEventDetails[1]);

      // Act
      const result = await gameHandler.loadEventDetailsFromEventId(eventId);

      // Assert
      expect(mockEventService.fetchEvent).toHaveBeenCalledWith(eventId);
      expect(mockEventService.fetchEventDetail).toHaveBeenCalledWith("detail1");
      expect(mockEventService.fetchEventDetail).toHaveBeenCalledWith("detail2");
      expect(result).toEqual(mockEventDetails);
    });

    it("should throw error when event not found", async () => {
      // Arrange
      const eventId = 12345;
      mockEventService.fetchEvent.mockResolvedValue(null);

      // Act & Assert
      await expect(gameHandler.loadEventDetailsFromEventId(eventId)).rejects.toThrow(
        `Event not found for eventId ${eventId}`
      );
    });
  });

  describe("createUpcomingRoundAndEvent", () => {
    it("should create round and event when game is enabled", async () => {
      // Arrange
      const roundId = 123;
      const scheduleStartTs = new Date("2023-01-01T10:00:00Z");
      const mockRound = {
        roundId: 123,
        roundTime: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        eventID: 12345,
        gameId: 2001,
        ended: false,
        matchConfig: {} as any,
        selections: [
          { ft_hdp_home: { name: "ft_hdp_home", price: 1.8 } },
          { ft_hdp_away: { name: "ft_hdp_away", price: 2.2 } },
        ],
      } as any;
      const mockEvent = { eventID: 12345 };
      const mockEventDetails = [
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
          eventID: 12345,
          oddsAvailableTs: new Date(),
          scheduleStartTs: new Date(),
          resultsAvailableTs: new Date(),
          hasResults: false,
        },
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
          eventID: 12345,
          oddsAvailableTs: new Date(),
          scheduleStartTs: new Date(),
          resultsAvailableTs: new Date(),
          hasResults: false,
        },
      ] as any;

      mockGameData.gameConfig = {
        config: { enabled: true },
      } as any;
      mockRoundGeneratorService.generateNewRound.mockReturnValue(mockRound);
      mockRoundService.insertRound.mockResolvedValue(undefined);
      mockEventService.createNewEvent.mockResolvedValue(mockEvent);
      jest.spyOn(gameHandler, "loadEventDetailsFromEventId").mockResolvedValue(mockEventDetails);
      jest.spyOn(gameHandler, "updateSelectionsForFirstEventDetail").mockResolvedValue(undefined);

      // Act
      await gameHandler.createUpcomingRoundAndEvent(roundId, scheduleStartTs);

      // Assert
      expect(mockRoundGeneratorService.generateNewRound).toHaveBeenCalledWith(roundId);
      expect(mockRoundService.insertRound).toHaveBeenCalledWith(mockRound);
      expect(mockEventService.createNewEvent).toHaveBeenCalledWith(mockRound, scheduleStartTs);
      expect(gameHandler.loadEventDetailsFromEventId).toHaveBeenCalledWith(12345);
      expect(mockScheduler.scheduleUpdateEventDetail).toHaveBeenCalledTimes(2);
      expect(gameHandler.updateSelectionsForFirstEventDetail).toHaveBeenCalledWith(mockEventDetails[0], mockRound);
    });

    it("should skip creation when game is disabled", async () => {
      // Arrange
      const roundId = 123;
      const scheduleStartTs = new Date("2023-01-01T10:00:00Z");
      mockGameData.gameConfig = {
        config: { enabled: false },
      } as any;

      // Act
      await gameHandler.createUpcomingRoundAndEvent(roundId, scheduleStartTs);

      // Assert
      expect(mockLogService.log).toHaveBeenCalledWith(
        "Game is not enabled, skipping upcoming round and event creation",
        "info"
      );
      expect(mockRoundGeneratorService.generateNewRound).not.toHaveBeenCalled();
    });

    it("should skip creation when game config is undefined", async () => {
      // Arrange
      const roundId = 123;
      const scheduleStartTs = new Date("2023-01-01T10:00:00Z");
      mockGameData.gameConfig = undefined;

      // Act
      await gameHandler.createUpcomingRoundAndEvent(roundId, scheduleStartTs);

      // Assert
      expect(mockLogService.log).toHaveBeenCalledWith(
        "Game is not enabled, skipping upcoming round and event creation",
        "info"
      );
      expect(mockRoundGeneratorService.generateNewRound).not.toHaveBeenCalled();
    });
  });

  describe("updateSelectionsForFirstEventDetail", () => {
    it("should update first event detail with selections and odds timestamp", async () => {
      // Arrange
      const mockEventDetail = {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        eventID: 12345,
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        hasResults: false,
      } as unknown as IEventDetail;
      const mockRound = {
        roundId: 123,
        roundTime: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        eventID: 12345,
        gameId: 2001,
        ended: false,
        matchConfig: {} as any,
        selections: [
          { ft_hdp_home: { name: "ft_hdp_home", price: 1.8 } },
          { ft_hdp_away: { name: "ft_hdp_away", price: 2.2 } },
        ],
        encryptedSelections: "encrypted_selections",
      } as any;
      const decryptedSelections = [{ ft_hdp_home: { name: "ft_hdp_home", price: 1.8 } }];

      (decrypt as jest.MockedFunction<typeof decrypt>).mockReturnValue(decryptedSelections);
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.updateSelectionsForFirstEventDetail(mockEventDetail, mockRound);

      // Assert
      expect(decrypt).toHaveBeenCalledWith("encrypted_selections");
      expect(mockEventDetail.selections).toEqual([{ name: "ft_hdp_home", price: 1.8 }]);
      expect(mockEventDetail.oddsAvailableTs).toBeInstanceOf(Date);
      expect(mockEventService.updateEventDetail).toHaveBeenCalledWith(mockEventDetail, [
        "selections",
        "oddsAvailableTs",
      ]);
    });
  });

  describe("handleOddsAvailableForEventDetail", () => {
    it("should update event detail selections", async () => {
      // Arrange

      const drawIndex = 1;
      const eventDetailId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      const roundId = 123;
      const mockEventDetail = {
        _id: eventDetailId,
        oddsAvailableTs: new Date("2023-01-01T10:00:00Z"),
        scheduleStartTs: new Date("2023-01-01T10:01:00Z"),
        resultsAvailableTs: new Date("2023-01-01T10:01:00Z"),
        hasResults: false,
      } as unknown as IEventDetail;
      const mockRound = {
        roundId: 123,
        roundTime: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        eventID: 12345,
        gameId: 2001,
        ended: false,
        matchConfig: {} as any,
        selections: [
          { ft_hdp_home: { name: "ft_hdp_home", price: 1.8 } },
          { ft_hdp_away: { name: "ft_hdp_away", price: 2.2 } },
        ],
      } as any;

      mockEventService.fetchEventDetail.mockResolvedValue(mockEventDetail);
      jest.spyOn(gameHandler, "loadRoundFromRoundId").mockResolvedValue(mockRound);
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleOddsAvailableForEventDetail(drawIndex, eventDetailId, roundId);

      // Assert
      expect(mockEventService.fetchEventDetail).toHaveBeenCalledWith(eventDetailId);
      expect(gameHandler.loadRoundFromRoundId).toHaveBeenCalledWith(roundId);
      expect(mockEventDetail.selections).toEqual([{ name: "ft_hdp_away", price: 2.2 }]);
      expect(mockEventService.updateEventDetail).toHaveBeenCalledWith(mockEventDetail, ["selections"]);
    });

    it("should log error when delay exceeds maxDelay for non-zero drawIndex", async () => {
      // Arrange
      const drawIndex = 1;
      const eventDetailId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      const roundId = 123;
      const mockEventDetail = {
        _id: eventDetailId,
        oddsAvailableTs: new Date("2023-01-01T10:00:00Z"),
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        hasResults: false,
      } as unknown as IEventDetail;
      const mockRound = {
        roundId: 123,
        roundTime: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        eventID: 12345,
        gameId: 2001,
        ended: false,
        matchConfig: {} as any,
        selections: [
          { ft_hdp_home: { name: "ft_hdp_home", price: 1.8 } },
          { ft_hdp_away: { name: "ft_hdp_away", price: 2.2 } },
        ],
      } as any;

      mockEventService.fetchEventDetail.mockResolvedValue(mockEventDetail);
      jest.spyOn(gameHandler, "loadRoundFromRoundId").mockResolvedValue(mockRound);
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleOddsAvailableForEventDetail(drawIndex, eventDetailId, roundId);

      // Assert
      expect(mockLogService.logError).toHaveBeenCalledWith(
        expect.stringContaining(`Odds available for event detail ${eventDetailId} is late by:`)
      );
    });
  });

  describe("handleVideoInfoAvailableForEventDetail", () => {
    it("should update event detail with video info", async () => {
      // Arrange
      const drawIndex = 0;
      const eventDetailId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      const roundId = 123;
      const mockEventDetail = {
        _id: eventDetailId,
        scheduleStartTs: new Date("2023-01-01T10:00:00Z"),
        oddsAvailableTs: new Date(),
        resultsAvailableTs: new Date(),
        hasResults: false,
      } as unknown as IEventDetail;
      const mockRound = {
        roundId: 123,
        roundTime: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        eventID: 12345,
        gameId: 2001,
        ended: false,
        matchConfig: {} as any,
        result: {
          drawResults: [{ playlist: "video1", goalInfo: "Goal scored at 15:30" }],
        },
      } as any;

      mockEventService.fetchEventDetail.mockResolvedValue(mockEventDetail);
      jest.spyOn(gameHandler, "loadRoundFromRoundId").mockResolvedValue(mockRound);
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleVideoInfoAvailableForEventDetail(drawIndex, eventDetailId, roundId);

      // Assert
      expect(mockEventDetail.playlist).toBe("video1");
      expect(mockEventDetail.goalInfo).toBe("Goal scored at 15:30");
      expect(mockEventService.updateEventDetail).toHaveBeenCalledWith(mockEventDetail, ["playlist", "goalInfo"]);
    });

    it("should log error when delay exceeds maxDelay", async () => {
      // Arrange
      const drawIndex = 0;
      const eventDetailId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      const roundId = 123;
      const mockEventDetail = {
        _id: eventDetailId,
        scheduleStartTs: new Date("2023-01-01T09:59:00Z"), // 1 minute ago
        oddsAvailableTs: new Date(),
        resultsAvailableTs: new Date(),
        hasResults: false,
      } as unknown as IEventDetail;
      const mockRound = {
        roundId: 123,
        roundTime: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        eventID: 12345,
        gameId: 2001,
        ended: false,
        matchConfig: {} as any,
        result: {
          drawResults: [{ playlist: "video1", goalInfo: "Goal scored" }],
        },
      } as any;

      mockEventService.fetchEventDetail.mockResolvedValue(mockEventDetail);
      jest.spyOn(gameHandler, "loadRoundFromRoundId").mockResolvedValue(mockRound);
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleVideoInfoAvailableForEventDetail(drawIndex, eventDetailId, roundId);

      // Assert
      expect(mockLogService.logError).toHaveBeenCalledWith(
        expect.stringContaining(`Video info available for event detail ${eventDetailId} is late by:`)
      );
    });
  });

  describe("handleResultAvailableForEventDetail", () => {
    it("should update event detail with result and handle round end for last timeline", async () => {
      // Arrange
      const drawIndex = 1; // Last timeline
      const eventDetailId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      const roundId = 123;
      const mockEventDetail = {
        _id: eventDetailId,
        resultsAvailableTs: new Date("2023-01-01T10:00:00Z"),
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        hasResults: false,
      } as unknown as IEventDetail;
      const mockRound = {
        roundId: 123,
        roundTime: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        eventID: 12345,
        gameId: 2001,
        ended: false,
        matchConfig: {} as any,
        result: {
          drawResults: [
            { result: { goalSequence: "H", finalScore: "1:0" } },
            { result: { goalSequence: "A", finalScore: "1:1" } },
          ],
        },
      } as any;

      mockGameSettings.gameTiming.timelines = [{}, {}]; // 2 timelines
      mockEventService.fetchEventDetail.mockResolvedValue(mockEventDetail);
      jest.spyOn(gameHandler, "loadRoundFromRoundId").mockResolvedValue(mockRound);
      jest.spyOn(gameHandler, "handleUpdateSettlementResult").mockResolvedValue(undefined);
      jest.spyOn(gameHandler, "handleRoundEnded").mockResolvedValue(undefined);
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleResultAvailableForEventDetail(drawIndex, eventDetailId, roundId);

      // Assert
      expect(mockEventDetail.hasResults).toBe(true);
      expect(mockEventDetail.result).toEqual({ goalSequence: "A", finalScore: "1:1" });
      expect(mockEventService.updateEventDetail).toHaveBeenCalledWith(mockEventDetail, ["result", "hasResults"]);
      expect(gameHandler.handleUpdateSettlementResult).toHaveBeenCalledWith(mockRound);
      expect(gameHandler.handleRoundEnded).toHaveBeenCalledWith(roundId);
    });

    it("should not handle round end for non-last timeline", async () => {
      // Arrange
      const drawIndex = 0; // First timeline
      const eventDetailId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      const roundId = 123;
      const mockEventDetail = {
        _id: eventDetailId,
        resultsAvailableTs: new Date("2023-01-01T10:00:00Z"),
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        hasResults: false,
      } as unknown as IEventDetail;
      const mockRound = {
        roundId: 123,
        roundTime: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        eventID: 12345,
        gameId: 2001,
        ended: false,
        matchConfig: {} as any,
        result: {
          drawResults: [{ result: { goalSequence: "H", finalScore: "1:0" } }],
        },
      } as any;

      mockGameSettings.gameTiming.timelines = [{}, {}]; // 2 timelines
      mockEventService.fetchEventDetail.mockResolvedValue(mockEventDetail);
      jest.spyOn(gameHandler, "loadRoundFromRoundId").mockResolvedValue(mockRound);
      jest.spyOn(gameHandler, "handleUpdateSettlementResult").mockResolvedValue(undefined);
      jest.spyOn(gameHandler, "handleRoundEnded").mockResolvedValue(undefined);
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleResultAvailableForEventDetail(drawIndex, eventDetailId, roundId);

      // Assert
      expect(gameHandler.handleUpdateSettlementResult).not.toHaveBeenCalled();
      expect(gameHandler.handleRoundEnded).not.toHaveBeenCalled();
    });
  });

  describe("handleUpdateSettlementResult", () => {
    it("should update settlement results for all event details", async () => {
      // Arrange
      const mockRound = {
        eventID: 12345,
      } as any;
      const mockEventDetails = [
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
          selections: [
            { name: "ft_hdp_home", settlementStatus: SettlementStatus.PLAY },
            { name: "ft_hdp_away", settlementStatus: SettlementStatus.PLAY },
          ],
          oddsAvailableTs: new Date(),
          scheduleStartTs: new Date(),
          resultsAvailableTs: new Date(),
          hasResults: false,
        },
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
          selections: [{ name: "ft_1x2_home", settlementStatus: SettlementStatus.PLAY }],
          oddsAvailableTs: new Date(),
          scheduleStartTs: new Date(),
          resultsAvailableTs: new Date(),
          hasResults: false,
        },
      ] as any;
      const mockSettlementResult = [
        { ft_hdp_home: SettlementStatus.WIN, ft_hdp_away: SettlementStatus.LOSE },
        { ft_1x2_home: SettlementStatus.DRAW },
      ];

      jest.spyOn(gameHandler, "loadEventDetailsFromEventId").mockResolvedValue(mockEventDetails);
      mockRound.settlementResult = mockSettlementResult;
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleUpdateSettlementResult(mockRound);

      // Assert
      expect(gameHandler.loadEventDetailsFromEventId).toHaveBeenCalledWith(12345);
      expect(mockEventDetails[0].selections[0].settlementStatus).toBe(SettlementStatus.WIN);
      expect(mockEventDetails[0].selections[1].settlementStatus).toBe(SettlementStatus.LOSE);
      expect(mockEventDetails[1].selections[0].settlementStatus).toBe(SettlementStatus.DRAW);
      expect(mockEventService.updateEventDetail).toHaveBeenCalledTimes(2);
    });

    it("should retry loading event details if selections are missing", async () => {
      // Arrange
      const mockRound = {
        eventID: 12345,
      } as GameRunningRound;
      const mockEventDetailsFirst = [
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
          selections: [], // Missing selections
          oddsAvailableTs: new Date(),
          scheduleStartTs: new Date(),
          resultsAvailableTs: new Date(),
          hasResults: false,
        },
      ] as any;
      const mockEventDetailsSecond = [
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
          selections: [{ name: "ft_hdp_home", settlementStatus: SettlementStatus.PLAY }],
          oddsAvailableTs: new Date(),
          scheduleStartTs: new Date(),
          resultsAvailableTs: new Date(),
          hasResults: false,
        },
      ] as any;

      jest
        .spyOn(gameHandler, "loadEventDetailsFromEventId")
        .mockResolvedValue([mockEventDetailsFirst, mockEventDetailsSecond]);
      mockRound.settlementResult = [{ ft_hdp_home: SettlementStatus.WIN }];
      mockEventService.updateEventDetail.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleUpdateSettlementResult(mockRound);

      // Assert
      expect(gameHandler.loadEventDetailsFromEventId).toHaveBeenCalledTimes(2);
    });
  });

  describe("handleRoundEnded", () => {
    it("should mark round as ended and decrypt data", async () => {
      // Arrange
      const roundId = 123;
      const mockRound = {
        roundId: 123,
        ended: false,
        encryptedSelections: "encrypted_selections",
        encryptedResult: "encrypted_result",
        encryptedSettlementResult: "encrypted_settlement",
      } as any;
      const decryptedSelections = [{ ft_hdp_home: { name: "ft_hdp_home" } }];
      const decryptedResult = { drawResults: [{ playlist: "video1" }] };
      const decryptedSettlement = [{ ft_hdp_home: SettlementStatus.WIN }];

      mockRoundService.fetchRoundData.mockResolvedValue(mockRound);
      (decrypt as jest.MockedFunction<typeof decrypt>)
        .mockReturnValueOnce(decryptedSelections)
        .mockReturnValueOnce(decryptedResult)
        .mockReturnValueOnce(decryptedSettlement);
      mockRoundService.updateRound.mockResolvedValue(undefined);

      // Act
      await gameHandler.handleRoundEnded(roundId);

      // Assert
      expect(mockRoundService.fetchRoundData).toHaveBeenCalledWith(roundId);
      expect(mockRound.ended).toBe(true);
      expect(decrypt).toHaveBeenCalledWith("encrypted_selections");
      expect(decrypt).toHaveBeenCalledWith("encrypted_result");
      expect(decrypt).toHaveBeenCalledWith("encrypted_settlement");
      expect(mockRound.selections).toEqual(decryptedSelections);
      expect(mockRound.result).toEqual(decryptedResult);
      expect(mockRound.settlementResult).toEqual(decryptedSettlement);
      expect(mockRoundService.updateRound).toHaveBeenCalledWith(mockRound);
    });
  });
});
