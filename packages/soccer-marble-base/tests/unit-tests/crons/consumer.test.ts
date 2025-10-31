import { Consumer } from "../../../src/crons/consumer";
import { mockContainer } from "../global-stubs";
import { JobName } from "../../../src/types";
import { idHelper } from "@soccer-marble/shared-utils";

jest.mock("@soccer-marble/shared-utils");
describe("Consumer", () => {
  let consumer: Consumer;
  let mockAgenda: any;
  let mockLogService: any;
  let mockGameHandler: any;
  let mockRoundService: any;
  let mockEventService: any;
  let mockGameSettings: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { agenda, logService, gameHandler, roundService, eventService, gameSettings } = mockContainer;
    mockAgenda = agenda;
    mockLogService = logService;
    mockGameHandler = gameHandler;
    mockRoundService = roundService;
    mockEventService = eventService;
    mockGameSettings = gameSettings;
    consumer = new Consumer(mockContainer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("start", () => {
    it("should define all job handlers", async () => {
      // Act
      await consumer.start();

      // Assert
      expect(mockAgenda.define).toHaveBeenCalledTimes(4);
      expect(mockAgenda.define).toHaveBeenCalledWith(JobName.ScheduleUpcomingEvent, expect.any(Function));
      expect(mockAgenda.define).toHaveBeenCalledWith(JobName.UpdateEventDetailOdds, expect.any(Function));
      expect(mockAgenda.define).toHaveBeenCalledWith(JobName.UpdateEventDetailVideoInfo, expect.any(Function));
      expect(mockAgenda.define).toHaveBeenCalledWith(JobName.UpdateEventDetailResult, expect.any(Function));
    });

    describe("ScheduleUpcomingEvent job", () => {
      let jobHandler: Function;
      let mockJob: any;

      beforeEach(async () => {
        await consumer.start();
        jobHandler = mockAgenda.define.mock.calls.find((call: any) => call[0] === JobName.ScheduleUpcomingEvent)[1];
        mockJob = {
          remove: jest.fn(),
        };
      });

      it("should create upcoming round when upcoming events count is less than required", async () => {
        // Arrange
        const upcomingEvents = [{ eventID: 1 }, { eventID: 2 }];
        const lastRoundId = 5;
        const lastEventId = 12345;
        const lastEvent = {
          scheduleStartTs: new Date("2023-01-01T10:00:00Z"),
          scheduleEndTs: new Date("2023-01-01T10:01:01Z"),
        };
        const upcomingRoundId = 6;
        const expectedScheduleStartTs = new Date("2023-01-01T10:01:01Z"); // schedule end time of last event

        mockEventService.fetchAllUpcomingEvents.mockResolvedValue(upcomingEvents);
        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);
        jest.spyOn(idHelper, "createEventId").mockReturnValue(lastEventId);
        mockEventService.fetchEvent.mockResolvedValue(lastEvent);
        mockGameHandler.createUpcomingRoundAndEvent.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockEventService.fetchAllUpcomingEvents).toHaveBeenCalled();
        expect(mockRoundService.initializeRoundId).toHaveBeenCalled();
        expect(idHelper.createEventId).toHaveBeenCalledWith(mockGameSettings.gameId, lastRoundId);
        expect(mockEventService.fetchEvent).toHaveBeenCalledWith(lastEventId, true);
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenCalledWith(
          upcomingRoundId,
          expectedScheduleStartTs
        );
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should use schedule end time of last event when it exists", async () => {
        // Arrange
        const upcomingEvents = [{ eventID: 1 }, { eventID: 2 }];
        const lastRoundId = 5;
        const lastEventId = 12345;
        const lastEvent = {
          scheduleStartTs: new Date("2023-01-01T10:00:00Z"),
          scheduleEndTs: new Date("2023-01-01T11:01:01Z"),
        };
        const upcomingRoundId = 6;
        const expectedScheduleStartTs = new Date("2023-01-01T11:01:01Z"); // schedule end time of last event

        mockEventService.fetchAllUpcomingEvents.mockResolvedValue(upcomingEvents);
        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);
        jest.spyOn(idHelper, "createEventId").mockReturnValue(lastEventId);
        mockEventService.fetchEvent.mockResolvedValue(lastEvent);
        mockGameHandler.createUpcomingRoundAndEvent.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenCalledWith(
          upcomingRoundId,
          expectedScheduleStartTs
        );
      });

      it("should use schedule start time of last event when schedule end time is not exists", async () => {
        // Arrange
        const upcomingEvents = [{ eventID: 1 }, { eventID: 2 }];
        const lastRoundId = 5;
        const lastEventId = 12345;
        const lastEvent = {
          scheduleStartTs: new Date("2023-01-01T10:00:00Z"),
        };

        mockGameSettings.gameTiming.wholeRound = 100;
        const upcomingRoundId = 6;
        const expectedScheduleStartTs = new Date(lastEvent.scheduleStartTs.getTime() + 100 * 1000); // schedule start time of last event + whole round time

        mockEventService.fetchAllUpcomingEvents.mockResolvedValue(upcomingEvents);
        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);
        jest.spyOn(idHelper, "createEventId").mockReturnValue(lastEventId);
        mockEventService.fetchEvent.mockResolvedValue(lastEvent);
        mockGameHandler.createUpcomingRoundAndEvent.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenCalledWith(
          upcomingRoundId,
          expectedScheduleStartTs
        );
      });

      it("should not create upcoming round when upcoming events count is sufficient", async () => {
        // Arrange
        const upcomingEvents = [{ eventID: 1 }, { eventID: 2 }, { eventID: 3 }, { eventID: 4 }];
        mockEventService.fetchAllUpcomingEvents.mockResolvedValue(upcomingEvents);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockEventService.fetchAllUpcomingEvents).toHaveBeenCalled();
        expect(mockRoundService.initializeRoundId).not.toHaveBeenCalled();
        expect(mockGameHandler.createUpcomingRoundAndEvent).not.toHaveBeenCalled();
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should use current date when no last event exists", async () => {
        // Arrange
        const upcomingEvents = [{ eventID: 1 }];
        const lastRoundId = 5;
        const lastEventId = 12345;

        mockEventService.fetchAllUpcomingEvents.mockResolvedValue(upcomingEvents);
        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);
        jest.spyOn(idHelper, "createEventId").mockReturnValue(lastEventId);
        mockEventService.fetchEvent.mockResolvedValue(null);
        mockGameHandler.createUpcomingRoundAndEvent.mockResolvedValue(undefined);

        const mockDate = new Date("2023-01-01T10:00:00Z");
        jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenCalledWith(6, mockDate);
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should handle errors and log them", async () => {
        // Arrange
        const error = new Error("Test error");
        mockEventService.fetchAllUpcomingEvents.mockRejectedValue(error);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockLogService.logError).toHaveBeenCalledWith(`Error in scheduleUpComingEvent: ${error}`);
        expect(mockJob.remove).toHaveBeenCalled();
      });
    });

    describe("UpdateEventDetailOdds job", () => {
      let jobHandler: Function;
      let mockJob: any;

      beforeEach(async () => {
        await consumer.start();
        jobHandler = mockAgenda.define.mock.calls.find((call: any) => call[0] === JobName.UpdateEventDetailOdds)[1];
        mockJob = {
          attrs: {
            data: {
              eventDetailId: "detail123",
              eventID: 12345,
              drawIndex: 0,
            },
          },
          remove: jest.fn(),
        };
      });

      it("should handle odds available for event detail", async () => {
        // Arrange
        const roundId = 5;
        jest.spyOn(idHelper, "extractRoundId").mockReturnValue(roundId);
        mockGameHandler.handleOddsAvailableForEventDetail.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(idHelper.extractRoundId).toHaveBeenCalledWith(12345);
        expect(mockGameHandler.handleOddsAvailableForEventDetail).toHaveBeenCalledWith(0, "detail123", roundId);
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should handle errors and log them", async () => {
        // Arrange
        const error = new Error("Test error");
        jest.spyOn(idHelper, "extractRoundId").mockReturnValue(5);
        mockGameHandler.handleOddsAvailableForEventDetail.mockRejectedValue(error);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockLogService.logError).toHaveBeenCalledWith(`Error in updateEventDetailOdds: ${error}`);
        expect(mockJob.remove).toHaveBeenCalled();
      });
    });

    describe("UpdateEventDetailVideoInfo job", () => {
      let jobHandler: Function;
      let mockJob: any;

      beforeEach(async () => {
        await consumer.start();
        jobHandler = mockAgenda.define.mock.calls.find(
          (call: any) => call[0] === JobName.UpdateEventDetailVideoInfo
        )[1];
        mockJob = {
          attrs: {
            data: {
              eventDetailId: "detail123",
              eventID: 12345,
              drawIndex: 1,
            },
          },
          remove: jest.fn(),
        };
      });

      it("should handle video info available for event detail", async () => {
        // Arrange
        const roundId = 5;
        jest.spyOn(idHelper, "extractRoundId").mockReturnValue(roundId);
        mockGameHandler.handleVideoInfoAvailableForEventDetail.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(idHelper.extractRoundId).toHaveBeenCalledWith(12345);
        expect(mockGameHandler.handleVideoInfoAvailableForEventDetail).toHaveBeenCalledWith(1, "detail123", roundId);
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should handle errors and log them", async () => {
        // Arrange
        const error = new Error("Test error");
        jest.spyOn(idHelper, "extractRoundId").mockReturnValue(5);
        mockGameHandler.handleVideoInfoAvailableForEventDetail.mockRejectedValue(error);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockLogService.logError).toHaveBeenCalledWith(`Error in updateEventDetailVideoInfo: ${error}`);
        expect(mockJob.remove).toHaveBeenCalled();
      });
    });

    describe("UpdateEventDetailResult job", () => {
      let jobHandler: Function;
      let mockJob: any;

      beforeEach(async () => {
        await consumer.start();
        jobHandler = mockAgenda.define.mock.calls.find((call: any) => call[0] === JobName.UpdateEventDetailResult)[1];
        mockJob = {
          attrs: {
            data: {
              eventDetailId: "detail123",
              eventID: 12345,
              drawIndex: 2,
            },
          },
          remove: jest.fn(),
        };
      });

      it("should handle result available for event detail", async () => {
        // Arrange
        const roundId = 5;
        jest.spyOn(idHelper, "extractRoundId").mockReturnValue(roundId);
        mockGameHandler.handleResultAvailableForEventDetail.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(idHelper.extractRoundId).toHaveBeenCalledWith(12345);
        expect(mockGameHandler.handleResultAvailableForEventDetail).toHaveBeenCalledWith(2, "detail123", roundId);
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should handle errors and log them", async () => {
        // Arrange
        const error = new Error("Test error");
        jest.spyOn(idHelper, "extractRoundId").mockReturnValue(5);
        mockGameHandler.handleResultAvailableForEventDetail.mockRejectedValue(error);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockLogService.logError).toHaveBeenCalledWith(`Error in updateEventDetailResult: ${error}`);
        expect(mockJob.remove).toHaveBeenCalled();
      });
    });
  });
});
