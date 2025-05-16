import mongoose from "mongoose";
import EventDetailModel from "../../../src/models/event-details";
import { SettlementStatus } from "../../../src/types";
import { mongoDbConnectionUrl } from "../global-stubs";
describe("Event Detail Model", () => {
  beforeAll(async () => {
    await mongoose.connect(mongoDbConnectionUrl);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await EventDetailModel.deleteMany({});
  });

  it("should create an event detail successfully", async () => {
    const eventDetail = new EventDetailModel({
      eventID: 1,
      oddsAvailableTs: new Date(),
      scheduleStartTs: new Date(),
      resultsAvailableTs: new Date(),
      selections: [
        {
          name: "Selection 1",
          price: 1.5,
          point: 2,
          settlementStatus: SettlementStatus.PLAY,
        },
      ],
    });

    const savedEventDetail = await eventDetail.save();
    expect(savedEventDetail._id).toBeDefined();
    expect(savedEventDetail.eventID).toBe(1);
    expect(savedEventDetail.oddsAvailableTs).toBeInstanceOf(Date);
    expect(savedEventDetail.scheduleStartTs).toBeInstanceOf(Date);
    expect(savedEventDetail.resultsAvailableTs).toBeInstanceOf(Date);
    expect(savedEventDetail.selections).toHaveLength(1);
    expect(savedEventDetail.selections?.[0].name).toBe("Selection 1");
    expect(savedEventDetail.selections?.[0].price).toBe(1.5);
    expect(savedEventDetail.selections?.[0].point).toBe(2);
    expect(savedEventDetail.selections?.[0].settlementStatus).toBe(SettlementStatus.PLAY);
    expect(savedEventDetail.hasResults).toBe(false);
  });

  it("should fail to create an event detail without required fields", async () => {
    const eventDetail = new EventDetailModel({});

    await expect(eventDetail.save()).rejects.toThrow();
  });

  it("should fail to create an event detail with invalid eventID type", async () => {
    const eventDetail = new EventDetailModel({
      eventID: "invalid",
      oddsAvailableTs: new Date(),
      scheduleStartTs: new Date(),
      resultsAvailableTs: new Date(),
      selections: [],
    });

    await expect(eventDetail.save()).rejects.toThrow();
  });

  it("should fail to create an event detail with invalid selections", async () => {
    const eventDetail = new EventDetailModel({
      eventID: 1,
      oddsAvailableTs: new Date(),
      scheduleStartTs: new Date(),
      resultsAvailableTs: new Date(),
      selections: [
        {
          name: "Selection 1",
          price: "invalid",
        },
      ],
    });

    await expect(eventDetail.save()).rejects.toThrow();
  });
});
