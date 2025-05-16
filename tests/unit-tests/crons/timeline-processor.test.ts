import { TimelineProcessor } from "../../../src/crons/timeline-processor";
import { mockContainer } from "../global-stubs";

describe("TimelineProcessor", () => {
  let processor: TimelineProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new TimelineProcessor(mockContainer);
  });

  describe("processTimelines", () => {
    it("should handle odds available for non-first draw", async () => {
      // Arrange
      const currentRoundTime = 5;
      mockContainer.gameSettings.gameTiming.timelines = [
        { OddsAvailable: 1, ScheduleStart: 2, ResultAvailable: 3 },
        { OddsAvailable: 5, ScheduleStart: 6, ResultAvailable: 7 },
      ];

      // Act
      await processor.processTimelines(currentRoundTime);

      // Assert
      expect(mockContainer.gameStateManager.handleOddsAvailableForDraw).toHaveBeenCalledWith(1);
      expect(mockContainer.gameStateManager.handleVideoInfoAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleResultAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleRoundSettle).not.toHaveBeenCalled();
    });

    it("should handle video info available", async () => {
      // Arrange
      const currentRoundTime = 6;
      mockContainer.gameSettings.gameTiming.timelines = [
        { OddsAvailable: 1, ScheduleStart: 2, ResultAvailable: 3 },
        { OddsAvailable: 5, ScheduleStart: 6, ResultAvailable: 7 },
      ];

      // Act
      await processor.processTimelines(currentRoundTime);

      // Assert
      expect(mockContainer.gameStateManager.handleOddsAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleVideoInfoAvailableForDraw).toHaveBeenCalledWith(1);
      expect(mockContainer.gameStateManager.handleResultAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleRoundSettle).not.toHaveBeenCalled();
    });

    it("should handle result available for non-last draw", async () => {
      // Arrange
      const currentRoundTime = 3;
      mockContainer.gameSettings.gameTiming.timelines = [
        { OddsAvailable: 1, ScheduleStart: 2, ResultAvailable: 3 },
        { OddsAvailable: 5, ScheduleStart: 6, ResultAvailable: 7 },
      ];

      // Act
      await processor.processTimelines(currentRoundTime);

      // Assert
      expect(mockContainer.gameStateManager.handleOddsAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleVideoInfoAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleResultAvailableForDraw).toHaveBeenCalledWith(0);
      expect(mockContainer.gameStateManager.handleRoundSettle).not.toHaveBeenCalled();
    });

    it("should handle result available for last draw and settle round", async () => {
      // Arrange
      const currentRoundTime = 7;
      mockContainer.gameSettings.gameTiming.timelines = [
        { OddsAvailable: 1, ScheduleStart: 2, ResultAvailable: 3 },
        { OddsAvailable: 5, ScheduleStart: 6, ResultAvailable: 7 },
      ];

      // Act
      await processor.processTimelines(currentRoundTime);

      // Assert
      expect(mockContainer.gameStateManager.handleOddsAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleVideoInfoAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleResultAvailableForDraw).toHaveBeenCalledWith(1);
      expect(mockContainer.gameStateManager.handleRoundSettle).toHaveBeenCalled();
    });

    it("should not trigger any handlers when current time doesn't match any timeline", async () => {
      // Arrange
      const currentRoundTime = 4;
      mockContainer.gameSettings.gameTiming.timelines = [
        { OddsAvailable: 1, ScheduleStart: 2, ResultAvailable: 3 },
        { OddsAvailable: 5, ScheduleStart: 6, ResultAvailable: 7 },
      ];

      // Act
      await processor.processTimelines(currentRoundTime);

      // Assert
      expect(mockContainer.gameStateManager.handleOddsAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleVideoInfoAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleResultAvailableForDraw).not.toHaveBeenCalled();
      expect(mockContainer.gameStateManager.handleRoundSettle).not.toHaveBeenCalled();
    });
  });
});
