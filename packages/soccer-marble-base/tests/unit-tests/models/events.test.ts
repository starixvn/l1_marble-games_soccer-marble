import mongoose from "mongoose";
import EventModel, { SelectionSchema } from "../../../src/models/events";
import { SettlementStatus } from "../../../src/types";

describe("Event Model", () => {
  it("should create model with default properties", () => {
    const event = new EventModel({
      eventID: 1,
      eventNameAKey: "Team A",
      eventNameBKey: "Team B",
      gameId: 1,
      eventDetails: [],
      scheduleStartTs: new Date(),
      eventConfig: {
        preloadDurationMs: 1000,
      },
    });

    expect(event.eventID).toBe(1);
    expect(event.eventNameAKey).toBe("Team A");
    expect(event.eventNameBKey).toBe("Team B");
    expect(event.gameId).toBe(1);
    expect(event.eventDetails).toEqual([]);
    expect(event.scheduleStartTs).toBeInstanceOf(Date);
    expect(event.eventConfig).toEqual({
      preloadDurationMs: 1000,
    });
  });

  it("should verify required properties", () => {
    const event = new EventModel({});

    const validationError = event.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("eventID");
    expect(validationError?.errors).toHaveProperty("eventNameAKey");
    expect(validationError?.errors).toHaveProperty("eventNameBKey");
    expect(validationError?.errors).toHaveProperty("gameId");
    expect(validationError?.errors).toHaveProperty("scheduleStartTs");
    expect(validationError?.errors).toHaveProperty("eventConfig");
  });

  it("should verify property types", () => {
    const event = new EventModel({
      eventID: "invalid",
      eventNameAKey: "Team A",
      eventNameBKey: "Team B",
      gameId: 1,
      eventDetails: [],
      scheduleStartTs: "invalid",
    });

    const validationError = event.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("eventID");
    expect(validationError?.errors).toHaveProperty("scheduleStartTs");
    expect(validationError?.errors).toHaveProperty("eventConfig");
  });
});

describe("Selection Schema", () => {
  it("should create selection with default properties", () => {
    const SelectionModel = mongoose.model("Selection", SelectionSchema);
    const selection = {
      name: "Selection 1",
      price: 1.5,
    };

    const doc = new SelectionModel(selection);
    expect(doc.name).toBe("Selection 1");
    expect(doc.price).toBe(1.5);
    expect(doc.point).toBe(0); // default value
    expect(doc.settlementStatus).toBe(SettlementStatus.PLAY); // default value
  });

  it("should create selection with all properties", () => {
    const SelectionModel = mongoose.model("Selection", SelectionSchema);
    const selection = {
      name: "Selection 1",
      price: 1.5,
      point: 2,
      settlementStatus: SettlementStatus.WIN,
    };

    const doc = new SelectionModel(selection);
    expect(doc.name).toBe("Selection 1");
    expect(doc.price).toBe(1.5);
    expect(doc.point).toBe(2);
    expect(doc.settlementStatus).toBe(SettlementStatus.WIN);
  });

  it("should verify selection required properties", () => {
    const SelectionModel = mongoose.model("Selection", SelectionSchema);
    const doc = new SelectionModel({});
    const validationError = doc.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("name");
    expect(validationError?.errors).toHaveProperty("price");
  });

  it("should verify selection property types", () => {
    const SelectionModel = mongoose.model("Selection", SelectionSchema);
    const doc = new SelectionModel({
      name: "Selection 1",
      price: 1.5,
      settlementStatus: "INVALID",
    });
    const validationError = doc.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("settlementStatus");
  });
});
