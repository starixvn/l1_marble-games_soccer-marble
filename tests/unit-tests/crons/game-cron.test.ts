import { GameCron } from "../../../src/crons/game-cron";
import { mockContainer } from "../global-stubs";
import cron from "cron";

jest.mock("cron", () => ({
  CronJob: jest.fn(),
}));
jest.mock("../../../src/helpers/crypto-helper");

describe("GameCron", () => {
  let gameCron: GameCron;

  beforeEach(() => {
    jest.clearAllMocks();
    gameCron = new GameCron(mockContainer);
  });

  describe("start", () => {
    it("should initialize round and start cron job successfully", async () => {
      const mockStartCron = jest.spyOn(gameCron as any, "startCron");

      await gameCron.start();

      expect(mockContainer.roundScheduler.initRoundId).toHaveBeenCalled();
      expect(mockContainer.roundScheduler.handleUnfinishedEvents).toHaveBeenCalled();
      expect(mockStartCron).toHaveBeenCalled();
    });

    it("should handle errors during initialization", async () => {
      const error = new Error("Test error");
      (mockContainer.roundScheduler.initRoundId as jest.Mock).mockRejectedValueOnce(error);

      await gameCron.start();

      expect(mockContainer.logService.logError).toHaveBeenCalledWith(error);
    });
  });

  describe("startCron", () => {
    let mockCronJob: jest.Mock;
    let mockStart: jest.Mock;
    let mockOnComplete: Function;

    beforeEach(() => {
      mockStart = jest.fn();
      mockCronJob = cron.CronJob as unknown as jest.Mock;
      mockCronJob.mockImplementation((cronTime, onTick, onComplete) => {
        mockOnComplete = onComplete;
        return { start: mockStart };
      });
    });

    it("should create and start a cron job", () => {
      gameCron.startCron();

      expect(mockCronJob).toHaveBeenCalledWith("* * * * * *", expect.any(Function), expect.any(Function));
      expect(mockStart).toHaveBeenCalled();
    });

    it("should handle errors in cron job execution", async () => {
      const error = new Error("Test error");
      let onTick: Function | undefined;

      mockCronJob.mockImplementation((_, callback) => {
        onTick = callback;
        return { start: mockStart };
      });

      gameCron.startCron();
      (mockContainer.timelineProcessor.processTimelines as jest.Mock).mockRejectedValueOnce(error);

      expect(onTick).toBeDefined();
      await onTick!();
      expect(mockContainer.logService.logError).toHaveBeenCalledWith(error);
    });

    it("should restart cron job when it unexpectedly stops", () => {
      gameCron.startCron();

      // Simulate cron job completion/stop
      expect(mockOnComplete).toBeDefined();
      mockOnComplete!();
      expect(mockContainer.logService.logError).toHaveBeenCalledWith(
        "Game cron job unexpectedly stopped because some other tasks halt it."
      );
      expect(mockStart).toHaveBeenCalledTimes(2); // Initial start + restart
    });
  });

  describe("proceed", () => {
    it("should handle pre-round phase", async () => {
      (mockContainer.gameStateManager.isPreRoundPhase as jest.Mock).mockReturnValue(true);

      await gameCron.proceed();

      expect(mockContainer.gameStateManager.setGameEnabled).toHaveBeenCalled();
    });

    it("should schedule upcoming rounds when needed", async () => {
      (mockContainer.gameStateManager.shouldScheduleUpcomingRounds as jest.Mock).mockReturnValue(true);

      await gameCron.proceed();

      expect(mockContainer.roundScheduler.scheduleUpcomingEvents).toHaveBeenCalled();
    });

    it("should advance round time when needed", async () => {
      (mockContainer.gameStateManager.shouldAdvanceRoundTime as jest.Mock).mockReturnValue(true);

      await gameCron.proceed();

      expect(mockContainer.gameStateManager.advanceRoundTime).toHaveBeenCalled();
    });

    it("should handle start of new round", async () => {
      (mockContainer.gameStateManager.isAtStartNewRound as jest.Mock).mockReturnValue(true);

      await gameCron.proceed();

      expect(mockContainer.gameStateManager.createUpcomingRoundAndEvent).toHaveBeenCalledWith(
        mockContainer.gameSettings.upcomingEvents
      );
      expect(mockContainer.gameStateManager.startNewRound).toHaveBeenCalled();
    });

    it("should handle round ending", async () => {
      (mockContainer.gameStateManager.isAtRoundEnded as jest.Mock).mockReturnValue(true);

      await gameCron.proceed();

      expect(mockContainer.gameStateManager.endCurrentRound).toHaveBeenCalled();
    });

    it("should process timelines with current round time", async () => {
      const currentTime = 1000;
      (mockContainer.gameStateManager.getCurrentRoundTime as jest.Mock).mockReturnValue(currentTime);

      await gameCron.proceed();

      expect(mockContainer.timelineProcessor.processTimelines).toHaveBeenCalledWith(currentTime);
    });
  });
});
