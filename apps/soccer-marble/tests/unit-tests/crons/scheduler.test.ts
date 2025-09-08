import { Scheduler } from "../../../src/crons/scheduler";
import { mockContainer } from "../global-stubs";
import { JobName } from "../../../src/types";
import { IEventDetail } from "../../../src/models/event-details";
import mongoose from "mongoose";

// Mock setInterval and clearInterval
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();

global.setInterval = mockSetInterval as any;
global.clearInterval = mockClearInterval as any;

describe("Scheduler", () => {
  let scheduler: Scheduler;
  let mockAgenda: any;
  let mockEventService: any;
  let mockGameData: any;
  let mockGameSettings: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { agenda, eventService, gameData, gameSettings } = mockContainer;
    mockAgenda = agenda;
    mockEventService = eventService;
    mockGameData = gameData;
    mockGameSettings = gameSettings;
    scheduler = new Scheduler(mockContainer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with container dependencies", () => {
      // Assert
      expect(scheduler).toBeInstanceOf(Scheduler);
    });
  });

  describe("scheduleUpcomingEvent", () => {
    const mockDate = new Date("2023-01-01T10:00:00Z");
    const RealDate = Date.now;

    beforeEach(() => {
      // Mock Date.now to return a specific timestamp
      global.Date.now = jest.fn(() => new Date(mockDate).getTime());
    });

    afterEach(() => {
      global.Date.now = RealDate;
      jest.restoreAllMocks();
    });

    it("should schedule upcoming event with default delay", async () => {
      // Act
      await scheduler.scheduleUpcomingEvent();

      // Assert
      expect(mockAgenda.schedule).toHaveBeenCalledWith(new Date(mockDate.getTime() + 0), JobName.ScheduleUpcomingEvent, {});
    });

    it("should schedule upcoming event with custom delay", async () => {
      // Arrange
      const delay = 5000;

      // Act
      await scheduler.scheduleUpcomingEvent(delay);

      // Assert
      expect(mockAgenda.schedule).toHaveBeenCalledWith(
        new Date(mockDate.getTime() + delay),
        JobName.ScheduleUpcomingEvent,
        {}
      );
    });
  });

  describe("scheduleUpcomingEvents", () => {
    it("should schedule multiple upcoming events when needed", async () => {
      // Arrange
      const upcomingEvents = [{ eventID: 1 }];
      const upcomingEventsToSchedule = 2; // 3 required - 1 existing = 2 to schedule
      mockEventService.fetchAllUpcomingEvents.mockResolvedValue(upcomingEvents);
      jest.spyOn(scheduler, "scheduleUpcomingEvent").mockResolvedValue(undefined);

      // Act
      await scheduler.scheduleUpcomingEvents();

      // Assert
      expect(mockEventService.fetchAllUpcomingEvents).toHaveBeenCalled();
      expect(scheduler.scheduleUpcomingEvent).toHaveBeenCalledTimes(upcomingEventsToSchedule);
      expect(scheduler.scheduleUpcomingEvent).toHaveBeenCalledWith(2000); // 1 * 2000
      expect(scheduler.scheduleUpcomingEvent).toHaveBeenCalledWith(4000); // 2 * 2000
    });

    it("should not schedule events when sufficient events exist", async () => {
      // Arrange
      const upcomingEvents = [{ eventID: 1 }, { eventID: 2 }, { eventID: 3 }, { eventID: 4 }];
      mockEventService.fetchAllUpcomingEvents.mockResolvedValue(upcomingEvents);
      jest.spyOn(scheduler, "scheduleUpcomingEvent").mockResolvedValue(undefined);

      // Act
      await scheduler.scheduleUpcomingEvents();

      // Assert
      expect(mockEventService.fetchAllUpcomingEvents).toHaveBeenCalled();
      expect(scheduler.scheduleUpcomingEvent).not.toHaveBeenCalled();
    });

    it("should handle zero upcoming events", async () => {
      // Arrange
      const upcomingEvents: any[] = [];
      const upcomingEventsToSchedule = 3; // 3 required - 0 existing = 3 to schedule
      mockEventService.fetchAllUpcomingEvents.mockResolvedValue(upcomingEvents);
      jest.spyOn(scheduler, "scheduleUpcomingEvent").mockResolvedValue(undefined);

      // Act
      await scheduler.scheduleUpcomingEvents();

      // Assert
      expect(mockEventService.fetchAllUpcomingEvents).toHaveBeenCalled();
      expect(scheduler.scheduleUpcomingEvent).toHaveBeenCalledTimes(upcomingEventsToSchedule);
    });
  });

  describe("scheduleUpdateEventDetail", () => {
    it("should schedule all jobs for non-zero drawIndex", async () => {
      // Arrange
      const eventDetail = {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        eventID: 12345,
        oddsAvailableTs: new Date("2023-01-01T10:00:00Z"),
        scheduleStartTs: new Date("2023-01-01T10:10:00Z"),
        resultsAvailableTs: new Date("2023-01-01T10:20:00Z"),
        hasResults: false,
      } as unknown as IEventDetail;
      const drawIndex = 1;

      // Act
      await scheduler.scheduleUpdateEventDetail(eventDetail, drawIndex);

      // Assert
      expect(mockAgenda.schedule).toHaveBeenCalledTimes(3);

      // Check odds job
      expect(mockAgenda.schedule).toHaveBeenCalledWith(
        new Date(eventDetail.oddsAvailableTs.getTime() - 100),
        JobName.UpdateEventDetailOdds,
        {
          eventDetailId: eventDetail._id,
          eventID: 12345,
          drawIndex: 1,
        }
      );

      // Check video info job
      expect(mockAgenda.schedule).toHaveBeenCalledWith(
        new Date(eventDetail.scheduleStartTs.getTime() - 100),
        JobName.UpdateEventDetailVideoInfo,
        {
          eventDetailId: eventDetail._id,
          eventID: 12345,
          drawIndex: 1,
        }
      );

      // Check result job
      expect(mockAgenda.schedule).toHaveBeenCalledWith(
        new Date(eventDetail.resultsAvailableTs.getTime() - 100),
        JobName.UpdateEventDetailResult,
        {
          eventDetailId: eventDetail._id,
          eventID: 12345,
          drawIndex: 1,
        }
      );
    });

    it("should not schedule odds job for drawIndex 0", async () => {
      // Arrange
      const eventDetail = {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        eventID: 12345,
        oddsAvailableTs: new Date("2023-01-01T10:00:00Z"),
        scheduleStartTs: new Date("2023-01-01T10:10:00Z"),
        resultsAvailableTs: new Date("2023-01-01T10:20:00Z"),
        hasResults: false,
      } as unknown as IEventDetail;
      const drawIndex = 0;

      // Act
      await scheduler.scheduleUpdateEventDetail(eventDetail, drawIndex);

      // Assert
      expect(mockAgenda.schedule).toHaveBeenCalledTimes(2);

      // Should not schedule odds job for drawIndex 0
      const oddsCall = mockAgenda.schedule.mock.calls.find((call: any) => call[1] === JobName.UpdateEventDetailOdds);
      expect(oddsCall).toBeUndefined();

      // Should still schedule video info and result jobs
      expect(mockAgenda.schedule).toHaveBeenCalledWith(
        new Date(eventDetail.scheduleStartTs.getTime() - 100),
        JobName.UpdateEventDetailVideoInfo,
        {
          eventDetailId: eventDetail._id,
          eventID: 12345,
          drawIndex: 0,
        }
      );

      expect(mockAgenda.schedule).toHaveBeenCalledWith(
        new Date(eventDetail.resultsAvailableTs.getTime() - 100),
        JobName.UpdateEventDetailResult,
        {
          eventDetailId: eventDetail._id,
          eventID: 12345,
          drawIndex: 0,
        }
      );
    });
  });

  describe("schedule", () => {
    it("should schedule upcoming events when game is enabled", async () => {
      // Arrange
      mockGameData.gameConfig = {
        config: { enabled: true },
      } as any;
      jest.spyOn(scheduler, "scheduleUpcomingEvents").mockResolvedValue(undefined);

      // Act
      await scheduler.schedule();

      // Assert
      expect(mockGameData.loadGameConfig).toHaveBeenCalled();
      expect(scheduler.scheduleUpcomingEvents).toHaveBeenCalled();
    });

    it("should clear intervals and set game status interval when game is disabled", async () => {
      // Arrange
      mockGameData.gameConfig = {
        config: { enabled: false },
      } as any;
      jest.spyOn(scheduler, "scheduleUpcomingEvents").mockResolvedValue(undefined);
      (scheduler as any).wholeRoundInterval = 123;

      // Act
      await scheduler.schedule();

      // Assert
      expect(mockGameData.loadGameConfig).toHaveBeenCalled();
      expect(mockClearInterval).toHaveBeenCalled();
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(scheduler.scheduleUpcomingEvents).not.toHaveBeenCalled();
    });

    it("should handle undefined game config", async () => {
      // Arrange
      mockGameData.gameConfig = undefined;
      jest.spyOn(scheduler, "scheduleUpcomingEvents").mockResolvedValue(undefined);
      (scheduler as any).wholeRoundInterval = 123;
      // Act
      await scheduler.schedule();

      // Assert
      expect(mockGameData.loadGameConfig).toHaveBeenCalled();
      expect(mockClearInterval).toHaveBeenCalled();
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(scheduler.scheduleUpcomingEvents).not.toHaveBeenCalled();
    });
  });

  describe("start", () => {
    it("should set game status interval", async () => {
      // Act
      await scheduler.start();

      // Assert
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });
  });

  describe("checkGameStatus", () => {
    it("should enable game and set whole round interval when game config is enabled", async () => {
      // Arrange
      mockGameData.gameConfig = {
        config: { enabled: true },
      } as any;
      jest.spyOn(scheduler, "scheduleUpcomingEvents").mockResolvedValue(undefined);
      jest.spyOn(scheduler, "schedule").mockResolvedValue(undefined);

      // Act
      await (scheduler as any).checkGameStatus();

      // Assert
      expect(mockGameData.loadGameConfig).toHaveBeenCalled();
      expect(scheduler.scheduleUpcomingEvents).toHaveBeenCalled();
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), mockGameSettings.gameTiming.wholeRound * 1000);
    });

    it("should not enable game when game config is disabled", async () => {
      // Arrange
      mockGameData.gameConfig = {
        config: { enabled: false },
      } as any;
      jest.spyOn(scheduler, "scheduleUpcomingEvents").mockResolvedValue(undefined);

      // Act
      await (scheduler as any).checkGameStatus();

      // Assert
      expect(mockGameData.loadGameConfig).toHaveBeenCalled();
      expect(scheduler.scheduleUpcomingEvents).not.toHaveBeenCalled();
      expect(mockSetInterval).not.toHaveBeenCalled();
    });

    it("should not enable game when game config is undefined", async () => {
      // Arrange
      mockGameData.gameConfig = undefined;
      jest.spyOn(scheduler, "scheduleUpcomingEvents").mockResolvedValue(undefined);

      // Act
      await (scheduler as any).checkGameStatus();

      // Assert
      expect(mockGameData.loadGameConfig).toHaveBeenCalled();
      expect(scheduler.scheduleUpcomingEvents).not.toHaveBeenCalled();
      expect(mockSetInterval).not.toHaveBeenCalled();
    });
  });

  describe("clearIntervals", () => {
    it("should clear both intervals when they exist", () => {
      // Arrange
      (scheduler as any).gameStatusInterval = 123;
      (scheduler as any).wholeRoundInterval = 456;

      // Act
      (scheduler as any).clearIntervals();

      // Assert
      expect(mockClearInterval).toHaveBeenCalledWith(123);
      expect(mockClearInterval).toHaveBeenCalledWith(456);
      expect((scheduler as any).gameStatusInterval).toBeNull();
      expect((scheduler as any).wholeRoundInterval).toBeNull();
    });

    it("should handle null intervals", () => {
      // Arrange
      (scheduler as any).gameStatusInterval = null;
      (scheduler as any).wholeRoundInterval = null;

      // Act
      (scheduler as any).clearIntervals();

      // Assert
      expect(mockClearInterval).not.toHaveBeenCalled();
    });
  });
});
