import { RoundScheduler } from "../../../src/crons/round-scheduler";
import { mockContainer } from "../global-stubs";

describe("RoundScheduler", () => {
  let scheduler: RoundScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new RoundScheduler(mockContainer);
  });

  describe("initRoundId", () => {
    it("should initialize round ID and set it in game state manager", async () => {
      // Arrange
      const mockRoundId = 123;
      (mockContainer.roundService.initializeRoundId as jest.Mock).mockResolvedValue(mockRoundId);

      // Act
      await scheduler.initRoundId();

      // Assert
      expect(mockContainer.roundService.initializeRoundId).toHaveBeenCalled();
      expect(mockContainer.gameStateManager.setRoundId).toHaveBeenCalledWith(mockRoundId);
    });
  });

  describe("handleUnfinishedEvents", () => {
    it("should log unfinished rounds and events", async () => {
      // Arrange
      const mockUnfinishedRounds = [
        { roundId: 2, eventID: 456 },
        { roundId: 1, eventID: 123 },
      ];
      const mockUnfinishedEvents = [{ eventID: 789 }, { eventID: 456 }];

      (mockContainer.roundService.fetchAllUnfinishedRounds as jest.Mock).mockResolvedValue(mockUnfinishedRounds);
      (mockContainer.eventService.fetchAllUpcomingEvents as jest.Mock).mockResolvedValue(mockUnfinishedEvents);

      // Act
      await scheduler.handleUnfinishedEvents();

      // Assert
      expect(mockContainer.roundService.fetchAllUnfinishedRounds).toHaveBeenCalled();
      expect(mockContainer.eventService.fetchAllUpcomingEvents).toHaveBeenCalled();
      expect(mockContainer.logService.logError).toHaveBeenCalledWith("List of unfinished events: 456, 123");
      expect(mockContainer.logService.logError).toHaveBeenCalledWith("List of unfinished upcoming events: 789, 456");
      expect(mockContainer.logService.log).toHaveBeenCalledWith(expect.stringContaining("current time:"), "info");
    });
  });

  describe("scheduleUpcomingEvents", () => {
    it("should create upcoming rounds and events based on game settings", async () => {
      // Arrange
      const mockUpcomingEvents = 3;
      mockContainer.gameSettings.upcomingEvents = mockUpcomingEvents;

      // Act
      await scheduler.scheduleUpcomingEvents();

      // Assert
      expect(mockContainer.gameStateManager.createUpcomingRoundAndEvent).toHaveBeenCalledTimes(mockUpcomingEvents - 1);
      expect(mockContainer.gameStateManager.createUpcomingRoundAndEvent).toHaveBeenCalledWith(1);
      expect(mockContainer.gameStateManager.createUpcomingRoundAndEvent).toHaveBeenCalledWith(2);
    });

    it("should not create any events when upcomingEvents is 1", async () => {
      // Arrange
      mockContainer.gameSettings.upcomingEvents = 1;

      // Act
      await scheduler.scheduleUpcomingEvents();

      // Assert
      expect(mockContainer.gameStateManager.createUpcomingRoundAndEvent).not.toHaveBeenCalled();
    });
  });

  describe("isScheduling flag", () => {
    it("should be false by default", () => {
      expect(scheduler.isScheduling).toBe(false);
    });

    it("should be set to true when scheduleUpcomingEvents starts", async () => {
      await scheduler.scheduleUpcomingEvents();
      expect(scheduler.isScheduling).toBe(true);
    });

    it("should maintain scheduling state during multiple event creations", async () => {
      mockContainer.gameSettings.upcomingEvents = 3;
      await scheduler.scheduleUpcomingEvents();
      expect(scheduler.isScheduling).toBe(true);
      expect(mockContainer.gameStateManager.createUpcomingRoundAndEvent).toHaveBeenCalledTimes(2);
    });
  });
});
