import { EventService } from "../../../src/services/event-service";
import { mockContainer } from "../global-stubs";

describe("EventService", () => {
  let eventService: EventService;
  let mockEventRepository: any;
  let mockEventDetailsRepository: any;
  let mockLogService: any;
  beforeEach(() => {
    jest.clearAllMocks();
    const { eventRepository, eventDetailsRepository, logService } = mockContainer;
    mockEventRepository = eventRepository;
    mockEventDetailsRepository = eventDetailsRepository;
    mockLogService = logService;
    eventService = new EventService(mockContainer);
    jest.spyOn(Date, "now").mockImplementation(() => 1625097600000); // 2021-07-01
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct dependencies from container", () => {
      // Act
      const service = new EventService(mockContainer);

      // Assert
      expect(service).toBeInstanceOf(EventService);
      // The service should be properly initialized with the container dependencies
      // This is implicitly tested by the fact that other tests work correctly
    });
  });

  describe("createNewEvent", () => {
    it("should create event details and event with correct data", async () => {
      // Arrange
      const roundData = {
        matchConfig: {
          gameTiming: {
            timelines: [
              { OddsAvailable: 1, ScheduleStart: 2, ResultAvailable: 3 },
              { OddsAvailable: 1, ScheduleStart: 2, ResultAvailable: 3 },
            ],
            wholeRound: 60,
          },
        },
        theme: "2001",
        roundId: 1,
        homeTeam: "clb_rma",
        awayTeam: "clb_mci",
        eventID: 123,
        gameId: 2001,
        ended: false,
        encryptedResult: null,
        encryptedSettlementResult: null,
        encryptedSelections: null,
      };
      const fakeEventDetails = [{ _id: "id1" }, { _id: "id2" }];
      jest.spyOn(eventService, "createNewEventDetails").mockResolvedValue(fakeEventDetails as any);
      mockEventRepository.create.mockResolvedValue({ eventID: 123 });

      const mockScheduleStartTs = new Date(Date.now() + 1000);

      // Act
      const result = await eventService.createNewEvent(roundData as any, mockScheduleStartTs);

      // Assert
      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventID: 123,
          eventNameAKey: "clb_rma",
          eventNameBKey: "clb_mci",
          gameId: 2001,
          theme: "2001",
          eventDetails: ["id1", "id2"],
        })
      );
      expect(result).toEqual({ eventID: 123 });
    });

    it("should handle schedule start time in the past by adding 2 seconds delay", async () => {
      // Arrange
      const roundData = {
        matchConfig: {
          gameTiming: {
            timelines: [{ OddsAvailable: 1, ScheduleStart: 2, ResultAvailable: 3 }],
            wholeRound: 60,
          },
        },
        theme: "2001",
        homeTeam: "clb_rma",
        awayTeam: "clb_mci",
        eventID: 123,
      };
      const fakeEventDetails = [{ _id: "id1" }];
      jest.spyOn(eventService, "createNewEventDetails").mockResolvedValue(fakeEventDetails as any);
      mockEventRepository.create.mockResolvedValue({ eventID: 123 });

      // Schedule start time in the past
      const pastScheduleStartTs = new Date(Date.now() - 1000);

      // Act
      await eventService.createNewEvent(roundData as any, pastScheduleStartTs);

      // Assert
      const createCall = mockEventRepository.create.mock.calls[0][0];
      expect(createCall.scheduleStartTs.getTime()).toBeGreaterThan(Date.now());
      expect(createCall.scheduleEndTs.getTime()).toBe(createCall.scheduleStartTs.getTime() + 60 * 1000);
    });
  });

  describe("createNewEventDetails", () => {
    it("should create event details for each timeline with correct timestamps", async () => {
      // Arrange
      const eventId = 123;
      const startTime = new Date(Date.now() + 1000);
      const roundData = {
        matchConfig: {
          gameTiming: {
            timelines: [
              { OddsAvailable: 10, ScheduleStart: 20, ResultAvailable: 30 },
              { OddsAvailable: 40, ScheduleStart: 50, ResultAvailable: 60 },
            ],
          },
          eventDetailInfos: [{ phase: 0 }, { phase: 1 }],
        },
      };

      const mockCreatedDetails = [
        { _id: "detail1", eventID: eventId, phase: 0 },
        { _id: "detail2", eventID: eventId, phase: 1 },
      ];

      mockEventDetailsRepository.create
        .mockResolvedValueOnce(mockCreatedDetails[0])
        .mockResolvedValueOnce(mockCreatedDetails[1]);

      // Act
      const result = await eventService.createNewEventDetails(eventId, startTime, roundData as any);

      // Assert
      expect(mockEventDetailsRepository.create).toHaveBeenCalledTimes(2);

      // First timeline
      expect(mockEventDetailsRepository.create).toHaveBeenNthCalledWith(1, {
        eventID: eventId,
        oddsAvailableTs: new Date(startTime.getTime() + 10 * 1000),
        scheduleStartTs: new Date(startTime.getTime() + 20 * 1000),
        resultsAvailableTs: new Date(startTime.getTime() + 30 * 1000),
        hasResults: false,
        phase: 0,
      });

      // Second timeline
      expect(mockEventDetailsRepository.create).toHaveBeenNthCalledWith(2, {
        eventID: eventId,
        oddsAvailableTs: new Date(startTime.getTime() + 40 * 1000),
        scheduleStartTs: new Date(startTime.getTime() + 50 * 1000),
        resultsAvailableTs: new Date(startTime.getTime() + 60 * 1000),
        hasResults: false,
        phase: 1,
      });

      expect(result).toEqual(mockCreatedDetails);
    });

    it("should handle single timeline correctly", async () => {
      // Arrange
      const eventId = 456;
      const startTime = new Date(Date.now() + 2000);
      const roundData = {
        matchConfig: {
          gameTiming: {
            timelines: [{ OddsAvailable: 5, ScheduleStart: 10, ResultAvailable: 15 }],
          },
          eventDetailInfos: [{ phase: 0 }],
        },
      };

      const mockCreatedDetail = { _id: "detail1", eventID: eventId, phase: 0 };
      mockEventDetailsRepository.create.mockResolvedValue(mockCreatedDetail);

      // Act
      const result = await eventService.createNewEventDetails(eventId, startTime, roundData as any);

      // Assert
      expect(mockEventDetailsRepository.create).toHaveBeenCalledTimes(1);
      expect(mockEventDetailsRepository.create).toHaveBeenCalledWith({
        eventID: eventId,
        oddsAvailableTs: new Date(startTime.getTime() + 5 * 1000),
        scheduleStartTs: new Date(startTime.getTime() + 10 * 1000),
        resultsAvailableTs: new Date(startTime.getTime() + 15 * 1000),
        hasResults: false,
        phase: 0,
      });
      expect(result).toEqual([mockCreatedDetail]);
    });
  });

  describe("updateEventDetail", () => {
    it("should call updateOne with correct arguments when fields are specified", async () => {
      // Arrange
      const eventDetail = { _id: "id1", hasResults: true, phase: 0 };
      mockEventDetailsRepository.updateOne.mockResolvedValue({});

      // Act
      await eventService.updateEventDetail(eventDetail as any, ["hasResults"]);

      // Assert
      expect(mockEventDetailsRepository.updateOne).toHaveBeenCalledWith({ _id: "id1" }, { $set: { hasResults: true } });
    });

    it("should update all fields when no fields parameter is provided", async () => {
      // Arrange
      const eventDetail = { _id: "id1", hasResults: true, phase: 0, eventID: 123 };
      mockEventDetailsRepository.updateOne.mockResolvedValue({});

      // Act
      await eventService.updateEventDetail(eventDetail as any);

      // Assert
      expect(mockEventDetailsRepository.updateOne).toHaveBeenCalledWith(
        { _id: "id1" },
        { $set: { _id: "id1", hasResults: true, phase: 0, eventID: 123 } }
      );
    });

    it("should handle multiple specified fields", async () => {
      // Arrange
      const eventDetail = { _id: "id1", hasResults: true, phase: 0, eventID: 123 };
      mockEventDetailsRepository.updateOne.mockResolvedValue({});

      // Act
      await eventService.updateEventDetail(eventDetail as any, ["hasResults", "phase"]);

      // Assert
      expect(mockEventDetailsRepository.updateOne).toHaveBeenCalledWith(
        { _id: "id1" },
        { $set: { hasResults: true, phase: 0 } }
      );
    });
  });

  describe("fetchEvent", () => {
    it("should return event if found", async () => {
      // Arrange
      const fakeEvent = { eventID: 123 };
      mockEventRepository.findOne.mockReturnThis();
      mockEventRepository.lean.mockReturnThis();
      mockEventRepository.exec.mockResolvedValue(fakeEvent);

      // Act
      const result = await eventService.fetchEvent(123);

      // Assert
      expect(result).toEqual(fakeEvent);
    });

    it("should log and throw if event not found", async () => {
      // Arrange
      mockEventRepository.findOne.mockReturnThis();
      mockEventRepository.lean.mockReturnThis();
      mockEventRepository.exec.mockResolvedValue(null);

      // Act
      await expect(eventService.fetchEvent(123)).rejects.toThrow("Event not found for eventId 123");

      // Assert
      expect(mockLogService.logError).toHaveBeenCalledWith("Event not found for eventId 123");
    });

    it("should return null if event not found and nullable is true", async () => {
      // Arrange
      mockEventRepository.findOne.mockReturnThis();
      mockEventRepository.lean.mockReturnThis();
      mockEventRepository.exec.mockResolvedValue(null);

      // Act
      const result = await eventService.fetchEvent(123, true);

      // Assert
      expect(result).toBeNull();
      expect(mockLogService.logError).not.toHaveBeenCalled();
    });

    it("should return event if found even when nullable is true", async () => {
      // Arrange
      const fakeEvent = { eventID: 123 };
      mockEventRepository.findOne.mockReturnThis();
      mockEventRepository.lean.mockReturnThis();
      mockEventRepository.exec.mockResolvedValue(fakeEvent);

      // Act
      const result = await eventService.fetchEvent(123, true);

      // Assert
      expect(result).toEqual(fakeEvent);
    });
  });

  describe("fetchEventDetail", () => {
    it("should return event detail if found", async () => {
      // Arrange
      const fakeDetail = { _id: "id1" };
      mockEventDetailsRepository.findOne.mockReturnThis();
      mockEventDetailsRepository.lean.mockReturnThis();
      mockEventDetailsRepository.exec.mockResolvedValue(fakeDetail);

      // Act
      const result = await eventService.fetchEventDetail("id1" as any);

      // Assert
      expect(result).toEqual(fakeDetail);
    });
    it("should log and throw if event detail not found", async () => {
      // Arrange
      mockEventDetailsRepository.findOne.mockReturnThis();
      mockEventDetailsRepository.lean.mockReturnThis();
      mockEventDetailsRepository.exec.mockResolvedValue(null);

      // Act
      await expect(eventService.fetchEventDetail("id1" as any)).rejects.toThrow("Event detail not found for _id id1");

      // Assert
      expect(mockLogService.logError).toHaveBeenCalledWith("Event detail not found for _id id1");
    });
  });

  describe("fetchAllUpcomingEvents", () => {
    it("should call find with correct query and return result", async () => {
      // Arrange
      const fakeEvents = [{ eventID: 1 }, { eventID: 2 }];
      mockEventRepository.find.mockReturnThis();
      mockEventRepository.lean.mockReturnThis();
      mockEventRepository.exec.mockResolvedValue(fakeEvents);

      // Act
      const result = await eventService.fetchAllUpcomingEvents();

      // Assert
      expect(mockEventRepository.find).toHaveBeenCalledWith(
        { gameId: mockContainer.gameSettings.gameId, scheduleStartTs: { $gt: expect.any(Date) } },
        "eventID"
      );
      expect(result).toEqual(fakeEvents);
    });
  });
});
