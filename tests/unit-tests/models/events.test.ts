import mongoose from "mongoose";
import EventModel, { SelectionSchema } from "../../../src/models/events";
import { SettlementStatus } from "../../../src/types";
import { mongoDbConnectionUrl } from "../global-stubs";

describe("Event Selection Model Tests", () => {
  beforeAll(async () => {
    await mongoose.connect(mongoDbConnectionUrl);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await EventModel.deleteMany({});
  });

  describe("Event Model", () => {
    it("should create an event successfully", async () => {
      const event = new EventModel({
        eventID: 1,
        eventNameAKey: "Team A",
        eventNameBKey: "Team B",
        gameId: 1,
        eventDetails: [],
        scheduleStartTs: new Date(),
      });

      const savedEvent = await event.save();
      expect(savedEvent._id).toBeDefined();
      expect(savedEvent.eventID).toBe(1);
      expect(savedEvent.eventNameAKey).toBe("Team A");
      expect(savedEvent.eventNameBKey).toBe("Team B");
      expect(savedEvent.gameId).toBe(1);
      expect(savedEvent.eventDetails).toEqual([]);
      expect(savedEvent.scheduleStartTs).toBeInstanceOf(Date);
    });

    it("should fail to create an event without required fields", async () => {
      const event = new EventModel({});

      await expect(event.save()).rejects.toThrow();
    });

    it("should fail to create an event with invalid eventID type", async () => {
      const event = new EventModel({
        eventID: "invalid",
        eventNameAKey: "Team A",
        eventNameBKey: "Team B",
        gameId: 1,
        eventDetails: [],
        scheduleStartTs: new Date(),
      });

      await expect(event.save()).rejects.toThrow();
    });

    it("should fail to create an event with invalid scheduleStartTs type", async () => {
      const event = new EventModel({
        eventID: 1,
        eventNameAKey: "Team A",
        eventNameBKey: "Team B",
        gameId: 1,
        eventDetails: [],
        scheduleStartTs: "invalid",
      });

      await expect(event.save()).rejects.toThrow();
    });
  });

  describe("Selection Schema", () => {
    it("should validate a selection with required fields", () => {
      const selection = {
        name: "Selection 1",
        price: 1.5,
      };

      const SelectionModel = mongoose.model("Selection", SelectionSchema);
      const doc = new SelectionModel(selection);
      expect(doc.name).toBe("Selection 1");
      expect(doc.price).toBe(1.5);
      expect(doc.point).toBe(0); // default value
      expect(doc.settlementStatus).toBe(SettlementStatus.PLAY); // default value
    });

    it("should validate a selection with all fields", () => {
      const selection = {
        name: "Selection 1",
        price: 1.5,
        point: 2,
        settlementStatus: SettlementStatus.WIN,
      };

      const SelectionModel = mongoose.model("Selection", SelectionSchema);
      const doc = new SelectionModel(selection);
      expect(doc.name).toBe("Selection 1");
      expect(doc.price).toBe(1.5);
      expect(doc.point).toBe(2);
      expect(doc.settlementStatus).toBe(SettlementStatus.WIN);
    });

    it("should fail to validate a selection without required fields", () => {
      const selection = {};

      const SelectionModel = mongoose.model("Selection", SelectionSchema);
      const doc = new SelectionModel(selection);
      const error = doc.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.name).toBeDefined();
      expect(error?.errors.price).toBeDefined();
    });

    it("should fail to validate a selection with invalid settlementStatus", () => {
      const selection = {
        name: "Selection 1",
        price: 1.5,
        settlementStatus: "INVALID",
      };

      const SelectionModel = mongoose.model("Selection", SelectionSchema);
      const doc = new SelectionModel(selection);
      const error = doc.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.settlementStatus).toBeDefined();
    });
  });
});
