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
          attrs: {
            data: {
              upcomingEventsToSchedule: 1,
            },
          },
          remove: jest.fn(),
        };
      });

      it("should create single upcoming round", async () => {
        // Arrange
        const lastRoundId = 5;
        const lastEventId = 12345;
        const lastEvent = {
          scheduleStartTs: new Date("2023-01-01T10:00:00Z"),
          scheduleEndTs: new Date("2023-01-01T10:01:01Z"),
        };
        const upcomingRoundId = 6;
        const expectedScheduleStartTs = new Date("2023-01-01T10:01:01Z"); // schedule end time of last event

        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);
        jest.spyOn(idHelper, "createEventId").mockReturnValue(lastEventId);
        mockEventService.fetchEventWithRetries.mockResolvedValue(lastEvent);
        mockGameHandler.createUpcomingRoundAndEvent.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockRoundService.initializeRoundId).toHaveBeenCalled();
        expect(idHelper.createEventId).toHaveBeenCalledWith(mockGameSettings.gameId, lastRoundId);
        expect(mockEventService.fetchEventWithRetries).toHaveBeenCalledWith(lastEventId);
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenCalledWith(
          upcomingRoundId,
          expectedScheduleStartTs
        );
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should create multiple upcoming rounds sequentially", async () => {
        // Arrange
        mockJob.attrs.data.upcomingEventsToSchedule = 3;
        const lastRoundId = 5;
        const lastEventId1 = 12345;
        const lastEventId2 = 12346;
        const lastEventId3 = 12347;
        const lastEvent1 = {
          scheduleStartTs: new Date("2023-01-01T10:00:00Z"),
          scheduleEndTs: new Date("2023-01-01T10:01:01Z"),
        };
        const lastEvent2 = {
          scheduleStartTs: new Date("2023-01-01T10:01:01Z"),
          scheduleEndTs: new Date("2023-01-01T10:02:02Z"),
        };
        const lastEvent3 = {
          scheduleStartTs: new Date("2023-01-01T10:02:02Z"),
          scheduleEndTs: new Date("2023-01-01T10:03:03Z"),
        };

        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);
        const createEventIdSpy = jest.spyOn(idHelper, "createEventId");
        createEventIdSpy.mockReturnValueOnce(lastEventId1);
        createEventIdSpy.mockReturnValueOnce(lastEventId2);
        createEventIdSpy.mockReturnValueOnce(lastEventId3);

        mockEventService.fetchEventWithRetries
          .mockResolvedValueOnce(lastEvent1)
          .mockResolvedValueOnce(lastEvent2)
          .mockResolvedValueOnce(lastEvent3);
        mockGameHandler.createUpcomingRoundAndEvent.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenCalledTimes(3);
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenNthCalledWith(
          1,
          6,
          new Date("2023-01-01T10:01:01Z")
        );
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenNthCalledWith(
          2,
          7,
          new Date("2023-01-01T10:02:02Z")
        );
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenNthCalledWith(
          3,
          8,
          new Date("2023-01-01T10:03:03Z")
        );
      });

      it("should use schedule start time of last event when schedule end time does not exist", async () => {
        // Arrange
        const lastRoundId = 5;
        const lastEventId = 12345;
        const lastEvent = {
          scheduleStartTs: new Date("2023-01-01T10:00:00Z"),
        };

        mockGameSettings.gameTiming.wholeRound = 100;
        const upcomingRoundId = 6;
        const expectedScheduleStartTs = new Date(lastEvent.scheduleStartTs.getTime() + 100 * 1000); // schedule start time of last event + whole round time

        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);
        jest.spyOn(idHelper, "createEventId").mockReturnValue(lastEventId);
        mockEventService.fetchEventWithRetries.mockResolvedValue(lastEvent);
        mockGameHandler.createUpcomingRoundAndEvent.mockResolvedValue(undefined);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenCalledWith(
          upcomingRoundId,
          expectedScheduleStartTs
        );
      });

      it("should not create any rounds when upcomingEventsToSchedule is 0", async () => {
        // Arrange
        mockJob.attrs.data.upcomingEventsToSchedule = 0;
        const lastRoundId = 5;
        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockRoundService.initializeRoundId).toHaveBeenCalled();
        expect(mockGameHandler.createUpcomingRoundAndEvent).not.toHaveBeenCalled();
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should use current date when lastRoundId is 0 (first round)", async () => {
        // Arrange
        const lastRoundId = 0; // First round, no previous events
        mockRoundService.initializeRoundId.mockResolvedValue(lastRoundId);
        mockGameHandler.createUpcomingRoundAndEvent.mockResolvedValue(undefined);

        const mockDate = new Date("2023-01-01T10:00:00Z");
        jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);

        // Act
        await jobHandler(mockJob);

        // Assert
        expect(mockEventService.fetchEventWithRetries).not.toHaveBeenCalled(); // Should skip fetching when lastRoundId is 0
        expect(mockGameHandler.createUpcomingRoundAndEvent).toHaveBeenCalledWith(1, mockDate);
        expect(mockJob.remove).toHaveBeenCalled();
      });

      it("should handle errors and log them", async () => {
        // Arrange
        const error = new Error("Test error");
        mockRoundService.initializeRoundId.mockRejectedValue(error);

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
