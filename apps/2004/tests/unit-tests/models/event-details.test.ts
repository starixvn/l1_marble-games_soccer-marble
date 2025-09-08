import EventDetailModel from "../../../src/models/event-details";
import { SettlementStatus } from "../../../src/types";

describe("Event Detail Model", () => {
  it("should create model with default properties", () => {
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
      phase: 0,
    });

    expect(eventDetail.eventID).toBe(1);
    expect(eventDetail.oddsAvailableTs).toBeInstanceOf(Date);
    expect(eventDetail.scheduleStartTs).toBeInstanceOf(Date);
    expect(eventDetail.resultsAvailableTs).toBeInstanceOf(Date);
    expect(eventDetail.selections).toHaveLength(1);
    expect(eventDetail.selections?.[0].name).toBe("Selection 1");
    expect(eventDetail.selections?.[0].price).toBe(1.5);
    expect(eventDetail.selections?.[0].point).toBe(2);
    expect(eventDetail.selections?.[0].settlementStatus).toBe(SettlementStatus.PLAY);
    expect(eventDetail.hasResults).toBe(false);
    expect(eventDetail.phase).toBe(0);
  });

  it("should verify required properties", () => {
    const eventDetail = new EventDetailModel({});

    const validationError = eventDetail.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("eventID");
    expect(validationError?.errors).toHaveProperty("oddsAvailableTs");
    expect(validationError?.errors).toHaveProperty("scheduleStartTs");
    expect(validationError?.errors).toHaveProperty("resultsAvailableTs");
    expect(validationError?.errors).toHaveProperty("phase");
  });

  it("should verify selection required properties", () => {
    const eventDetail = new EventDetailModel({
      eventID: 1,
      oddsAvailableTs: new Date(),
      scheduleStartTs: new Date(),
      phase: 0,
    });

    const validationError = eventDetail.validateSync();
    expect(validationError?.message).toBe(
      "event_details validation failed: resultsAvailableTs: Path `resultsAvailableTs` is required."
    );
  });
});
