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

  // describe("createNewEvent", () => {
  //   it("should create event details and event with correct data", async () => {
  //     // Arrange
  //     const roundData = {
  //       roundId: 1,
  //       roundTime: 0,
  //       homeTeam: "clb_rma",
  //       awayTeam: "clb_mci",
  //       eventID: 123,
  //       gameId: 2001,
  //       ended: false,
  //       encryptedResult: null,
  //       encryptedSettlementResult: null,
  //       encryptedSelections: null,
  //     };
  //     const fakeEventDetails = [{ _id: "id1" }, { _id: "id2" }];
  //     mockEventDetailsRepository.create
  //       .mockResolvedValueOnce(fakeEventDetails[0])
  //       .mockResolvedValueOnce(fakeEventDetails[1]);
  //     mockEventRepository.create.mockResolvedValue({ eventID: 123 });

  //     const mockScheduleStartTs = new Date(Date.now() + 1000);

  //     // Act
  //     const result = await eventService.createNewEvent(roundData as any, mockScheduleStartTs);

  //     // Assert
  //     expect(mockEventDetailsRepository.create).toHaveBeenCalledTimes(2);
  //     expect(mockEventRepository.create).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         eventID: 123,
  //         eventNameAKey: "clb_rma",
  //         eventNameBKey: "clb_mci",
  //         gameId: 2001,
  //         eventDetails: ["id1", "id2"],
  //       })
  //     );
  //     expect(result).toEqual({ eventID: 123 });
  //   });
  // });

  describe("updateEventDetail", () => {
    it("should call updateOne with correct arguments", async () => {
      // Arrange
      const eventDetail = { _id: "id1", hasResults: true };
      mockEventDetailsRepository.updateOne.mockResolvedValue({});

      // Act
      await eventService.updateEventDetail(eventDetail as any, ["hasResults"]);

      // Assert
      expect(mockEventDetailsRepository.updateOne).toHaveBeenCalledWith({ _id: "id1" }, { $set: { hasResults: true } });
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
