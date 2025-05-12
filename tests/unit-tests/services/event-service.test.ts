import { EventService } from "../../../src/services/event-service";
import { EventModel, EventDetailModel } from "../../../src/models";
import { IEventDetail } from "../../../src/models/event-details";
import { GameSettings, AppContainer, GameRunningRound } from "../../../src/types";
import mongoose from "mongoose";

// Jest mock setup
jest.mock("../../../src/models/events");
jest.mock("../../../src/models/event-details");

describe("EventService", () => {
  let eventService: EventService;
  let mockEventRepository: jest.Mocked<typeof EventModel>;
  let mockEventDetailsRepository: jest.Mocked<typeof EventDetailModel>;
  let mockGameSettings: GameSettings;
  let mockContainer: Partial<AppContainer>;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();

    mockEventRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<typeof EventModel>;

    mockEventDetailsRepository = {
      create: jest.fn(),
      updateOne: jest.fn(),
    } as unknown as jest.Mocked<typeof EventDetailModel>;

    mockGameSettings = {
      gameId: 123,
      gameTiming: {
        wholeRound: 120,
        timelines: [
          { OddsAvailable: 1, ScheduleStart: 31, ResultAvailable: 61 },
          { OddsAvailable: 61, ScheduleStart: 81, ResultAvailable: 111 },
        ],
      },
      teams: [],
      upcomingEvents: 5,
      numberOfVideos: {},
      choices: [],
    };

    mockContainer = {
      eventRepository: mockEventRepository,
      eventDetailsRepository: mockEventDetailsRepository,
      gameSettings: mockGameSettings,
    };

    eventService = new EventService(mockContainer as AppContainer);

    // Mock Date.now
    jest.spyOn(Date, "now").mockImplementation(() => 1625097600000); // 2021-07-01
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createNewEvent", () => {
    it("should create a new event with event details", async () => {
      // Arrange
      const roundData: GameRunningRound = {
        roundId: 123,
        homeTeam: "Team A",
        awayTeam: "Team B",
        roundTime: 300,
        eventID: 123,
        gameId: 123,
        ended: false,
        encryptedResult: null,
        encryptedSettlementResult: null,
        encryptedSelections: null,
      };

      const mockObjectId1 = new mongoose.Types.ObjectId();
      const mockObjectId2 = new mongoose.Types.ObjectId();

      const mockEventDetail1 = {
        _id: mockObjectId1,
        eventID: 123,
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        hasResults: false,
      };

      const mockEventDetail2 = {
        _id: mockObjectId2,
        eventID: 123,
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        hasResults: false,
      };

      mockEventDetailsRepository.create
        .mockResolvedValueOnce(mockEventDetail1 as any)
        .mockResolvedValueOnce(mockEventDetail2 as any);

      const mockEventId = new mongoose.Types.ObjectId();
      mockEventRepository.create.mockResolvedValue({
        _id: mockEventId,
        eventID: 123,
        eventNameAKey: "Team A",
        eventNameBKey: "Team B",
        gameId: 123,
        eventDetails: [mockObjectId1, mockObjectId2],
      } as any);

      // Act
      const event = await eventService.createNewEvent(roundData, 1);

      // Assert
      expect(mockEventDetailsRepository.create).toHaveBeenCalledTimes(2);
      expect(mockEventRepository.create).toHaveBeenCalledTimes(1);
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        eventID: 123,
        eventNameAKey: "Team A",
        eventNameBKey: "Team B",
        gameId: 123,
        eventDetails: [mockObjectId1, mockObjectId2],
        scheduleStartTs: expect.any(Date),
      });

      const expectedEvent = {
        _id: mockEventId,
        eventID: 123,
        eventNameAKey: "Team A",
        eventNameBKey: "Team B",
        gameId: 123,
        eventDetails: [mockObjectId1, mockObjectId2],
      };

      expect(event).toMatchObject(expectedEvent);
    });
  });

  describe("updateEventDetail", () => {
    it("should update an event detail with all fields", async () => {
      // Arrange
      const mockObjectId = new mongoose.Types.ObjectId();
      const eventDetail = {
        _id: mockObjectId,
        eventID: 123,
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        hasResults: true,
      };

      mockEventDetailsRepository.updateOne.mockResolvedValue({ acknowledged: true } as any);

      // Act
      await eventService.updateEventDetail(eventDetail as any);

      // Assert
      expect(mockEventDetailsRepository.updateOne).toHaveBeenCalledWith({ _id: mockObjectId }, { $set: eventDetail });
    });

    it("should update an event detail with specific fields", async () => {
      // Arrange
      const mockObjectId = new mongoose.Types.ObjectId();
      const eventDetail = {
        _id: mockObjectId,
        eventID: 123,
        oddsAvailableTs: new Date(),
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        hasResults: true,
      };

      const fieldsToUpdate: (keyof IEventDetail)[] = ["hasResults", "resultsAvailableTs"];

      mockEventDetailsRepository.updateOne.mockResolvedValue({ acknowledged: true } as any);

      // Act
      await eventService.updateEventDetail(eventDetail as any, fieldsToUpdate);

      // Assert
      expect(mockEventDetailsRepository.updateOne).toHaveBeenCalledWith(
        { _id: mockObjectId },
        {
          $set: {
            hasResults: eventDetail.hasResults,
            resultsAvailableTs: eventDetail.resultsAvailableTs,
          },
        }
      );
    });
  });
});
