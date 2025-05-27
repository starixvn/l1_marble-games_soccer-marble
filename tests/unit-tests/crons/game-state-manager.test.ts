import { GameStateManager } from "../../../src/crons/game-state-manager";
import { mockContainer } from "../global-stubs";
import { SettlementStatus, Selection, RoundResultType } from "../../../src/types";
import { decrypt } from "../../../src/helpers/crypto-helper";

jest.mock("../../../src/helpers/crypto-helper");

describe("GameStateManager", () => {
  let manager: GameStateManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new GameStateManager(mockContainer);
  });

  describe("setGameEnabled", () => {
    it("should set enabled to false when game config is not found", async () => {
      // Arrange
      (mockContainer.gameConfigService.getGameConfig as jest.Mock).mockResolvedValue(null);

      // Act
      await manager.setGameEnabled();

      // Assert
      expect(mockContainer.logService.logError).toHaveBeenCalledWith("Game config not found");
      expect(manager["enabled"]).toBe(false);
    });

    it("should set enabled based on game config", async () => {
      // Arrange
      (mockContainer.gameConfigService.getGameConfig as jest.Mock).mockResolvedValue({ gameId: 2001, enabled: true });

      // Act
      await manager.setGameEnabled();

      // Assert
      expect(manager["enabled"]).toBe(true);
    });
  });

  describe("startNewRound", () => {
    it("should log error when no upcoming round is found", async () => {
      // Arrange
      Object.defineProperty(manager, "upcomingRounds", { value: [], writable: true });

      // Act
      await manager.startNewRound();

      // Assert
      expect(mockContainer.logService.logError).toHaveBeenCalledWith("No upcoming round found");
    });

    it("should load new round and event details", async () => {
      // Arrange
      const roundId = 1;
      const eventId = 123;
      const mockRound = {
        ended: false,
        roundId,
        eventID: eventId,
        encryptedResult: "encrypted_result",
        encryptedSettlementResult: "encrypted_settlement",
        encryptedSelections: "encrypted_selections",
      };
      const mockEvent = {
        eventDetails: ["detail1", "detail2"],
      };
      const mockEventDetail = {
        id: "detail1",
        selections: [],
      };

      Object.defineProperty(manager, "upcomingRounds", { value: [roundId], writable: true });
      (mockContainer.roundService.fetchRoundData as jest.Mock).mockResolvedValue(mockRound);
      (mockContainer.eventService.fetchEvent as jest.Mock).mockResolvedValue(mockEvent);
      (mockContainer.eventService.fetchEventDetail as jest.Mock).mockResolvedValue(mockEventDetail);
      (decrypt as jest.Mock).mockImplementation((data) => {
        if (data === "encrypted_result") return { drawResults: [] };
        if (data === "encrypted_settlement") return [];
        if (data === "encrypted_selections") return [];
        return data;
      });

      // Act
      await manager.startNewRound();

      // Assert
      expect(mockContainer.roundService.fetchRoundData).toHaveBeenCalledWith(roundId);
      expect(mockContainer.eventService.fetchEvent).toHaveBeenCalledWith(eventId);
      expect(mockContainer.eventService.fetchEventDetail).toHaveBeenCalledWith("detail1");
      expect(manager["round"].roundTime).toBe(1);
      expect(manager["round"].ended).toBe(false);
    });
  });

  describe("createUpcomingRoundAndEvent", () => {
    it("should not create round when game is not enabled", async () => {
      // Arrange
      manager["enabled"] = false;

      // Act
      await manager.createUpcomingRoundAndEvent(1);

      // Assert
      expect(mockContainer.logService.log).toHaveBeenCalledWith(
        "Game is not enabled, skipping upcoming round and event creation",
        "info"
      );
      expect(mockContainer.roundGeneratorService.generateNewRound).not.toHaveBeenCalled();
    });

    it("should create new round and event when game is enabled", async () => {
      // Arrange
      const roundId = 1;
      const offset = 1;
      const mockRound = {
        roundId: roundId + offset,
        eventID: 123,
        encryptedSelections: "encrypted_selections",
      };
      const mockEvent = {
        eventDetails: ["detail1"],
      };
      const mockEventDetail = {
        id: "detail1",
        selections: [],
      };

      manager["enabled"] = true;
      manager["round"].roundId = roundId;
      (mockContainer.roundGeneratorService.generateNewRound as jest.Mock).mockReturnValue(mockRound);
      (mockContainer.eventService.createNewEvent as jest.Mock).mockResolvedValue(mockEvent);
      (mockContainer.eventService.fetchEventDetail as jest.Mock).mockResolvedValue(mockEventDetail);
      (decrypt as jest.Mock).mockReturnValue([
        {
          h1_hdp_home: {
            name: "h1_hdp_home",
            price: 1.6,
            point: 0.5,
            settlementStatus: "P",
          },
          h1_hdp_away: {
            name: "h1_hdp_away",
            price: 2.64,
            point: -0.5,
            settlementStatus: "P",
          },
        },
        {
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 2.21,
            point: 2.5,
            settlementStatus: "L",
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 1.82,
            point: -2.5,
            settlementStatus: "W",
          },
        },
      ]);
      const mockDate = new Date();
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;

      const firstEventDetail = {
        ...mockEventDetail,
        selections: [
          {
            name: "h1_hdp_home",
            price: 1.6,
            point: 0.5,
            settlementStatus: "P",
          },
          {
            name: "h1_hdp_away",
            price: 2.64,
            point: -0.5,
            settlementStatus: "P",
          },
        ],
        oddsAvailableTs: mockDate,
      };

      // Act
      await manager.createUpcomingRoundAndEvent(offset);

      // Assert
      expect(mockContainer.roundGeneratorService.generateNewRound).toHaveBeenCalledWith(roundId + offset);
      expect(mockContainer.roundService.insertRound).toHaveBeenCalledWith(mockRound);
      expect(mockContainer.eventService.createNewEvent).toHaveBeenCalledWith(mockRound, offset);
      expect(mockContainer.eventService.fetchEventDetail).toHaveBeenCalledWith("detail1");

      expect(mockContainer.eventService.updateEventDetail).toHaveBeenCalledWith(firstEventDetail, [
        "selections",
        "oddsAvailableTs",
      ]);
    });
  });

  describe("handleOddsAvailableForDraw", () => {
    it("should update event detail with selections", async () => {
      // Arrange
      const drawIndex = 0;
      const mockSelections: Record<string, Selection> = {
        some: { name: "some", price: 1.5, point: 0, settlementStatus: SettlementStatus.PLAY },
      };
      const mockEventDetail = {
        id: "detail1",
        selections: [],
      };

      manager["round"].selections = [mockSelections];
      manager["eventDetails"] = [mockEventDetail];

      // Act
      await manager.handleOddsAvailableForDraw(drawIndex);

      // Assert
      expect(mockContainer.eventService.updateEventDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          selections: [mockSelections.some],
        }),
        ["selections"]
      );
    });
  });

  describe("handleVideoInfoAvailableForDraw", () => {
    it("should update event detail with video info", async () => {
      // Arrange
      const drawIndex = 0;
      const mockResult: RoundResultType = {
        drawResults: [
          {
            playlist: "video1",
            goalInfo: "goal1",
            result: {
              goalSequence: "H",
              finalScore: "1:0",
            },
          },
        ],
      };
      const mockEventDetail = {
        id: "detail1",
      };

      manager["round"].result = mockResult;
      manager["eventDetails"] = [mockEventDetail];

      // Act
      await manager.handleVideoInfoAvailableForDraw(drawIndex);

      // Assert
      expect(mockContainer.eventService.updateEventDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          playlist: "video1",
          goalInfo: "goal1",
        }),
        ["playlist", "goalInfo"]
      );
    });
  });

  describe("handleResultAvailableForDraw", () => {
    it("should update event detail with result", async () => {
      // Arrange
      const drawIndex = 0;
      const mockResult: RoundResultType = {
        drawResults: [
          {
            playlist: "video1",
            goalInfo: "goal1",
            result: {
              goalSequence: "H",
              finalScore: "1:0",
            },
          },
        ],
      };
      const mockEventDetail = {
        id: "detail1",
      };

      manager["round"].result = mockResult;
      manager["eventDetails"] = [mockEventDetail];

      // Act
      await manager.handleResultAvailableForDraw(drawIndex);

      // Assert
      expect(mockContainer.eventService.updateEventDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          hasResults: true,
          result: {
            goalSequence: "H",
            finalScore: "1:0",
          },
        }),
        ["result", "hasResults"]
      );
    });
  });

  describe("handleRoundSettle", () => {
    it("should update settlement results and end round", async () => {
      // Arrange
      const mockSettlementResult = [
        {
          ft_hdp_home: SettlementStatus.WIN,
          ft_hdp_away: SettlementStatus.LOSE,
        },
      ];
      const mockSelections = [
        {
          name: "ft_hdp_home",
          settlementStatus: SettlementStatus.PLAY,
        },
        {
          name: "ft_hdp_away",
          settlementStatus: SettlementStatus.PLAY,
        },
      ];
      const mockEventDetail = {
        id: "detail1",
        selections: mockSelections,
      };

      manager["round"].settlementResult = mockSettlementResult;
      manager["eventDetails"] = [mockEventDetail];

      // Act
      await manager.handleRoundSettle();

      // Assert
      expect(mockContainer.eventService.updateEventDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          selections: [
            {
              name: "ft_hdp_home",
              settlementStatus: SettlementStatus.WIN,
            },
            {
              name: "ft_hdp_away",
              settlementStatus: SettlementStatus.LOSE,
            },
          ],
        }),
        ["selections"]
      );
      expect(mockContainer.roundService.updateRound).toHaveBeenCalledWith(
        expect.objectContaining({
          roundTime: 0,
          ended: true,
        })
      );
    });
  });

  describe("round time management", () => {
    it("should advance round time", () => {
      // Arrange
      manager["round"].roundTime = 0;

      // Act
      manager.advanceRoundTime();

      // Assert
      expect(manager["round"].roundTime).toBe(1);
    });

    it("should check if at round end", () => {
      // Arrange
      manager["round"].roundTime = mockContainer.gameSettings.gameTiming.wholeRound;

      // Act
      const result = manager.isAtRoundEnded();

      // Assert
      expect(result).toBe(true);
    });

    it("should check if at start of new round", () => {
      // Arrange
      manager["round"].roundTime = 1;

      // Act
      const result = manager.isAtStartNewRound();

      // Assert
      expect(result).toBe(true);
    });

    it("should check if in pre-round phase", () => {
      // Arrange
      manager["round"].roundTime = 0;

      // Act
      const result = manager.isPreRoundPhase();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("isGameDisabledAndAllRoundsEnded", () => {
    it("should return true when game is disabled, no upcoming rounds, and current round is ended", () => {
      // Set up the state
      manager["enabled"] = false;
      (manager as any)["upcomingRounds"] = [];

      expect(manager.isGameDisabledAndAllRoundsEnded()).toBe(true);
    });

    it("should return false when game is enabled", () => {
      // Set up the state
      manager["enabled"] = true;
      (manager as any)["upcomingRounds"] = [];
      manager["round"].ended = true;

      expect(manager.isGameDisabledAndAllRoundsEnded()).toBe(false);
    });

    it("should return false when there are upcoming rounds", () => {
      // Set up the state
      manager["enabled"] = false;
      (manager as any)["upcomingRounds"] = [1, 2];
      manager["round"].ended = true;

      expect(manager.isGameDisabledAndAllRoundsEnded()).toBe(false);
    });

    it("should return false when current round is not ended", () => {
      // Set up the state
      manager["enabled"] = false;
      (manager as any)["upcomingRounds"] = [];
      manager["round"].ended = false;

      expect(manager.isGameDisabledAndAllRoundsEnded()).toBe(false);
    });
  });
});
