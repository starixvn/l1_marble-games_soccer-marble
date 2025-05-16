import mongoose from "mongoose";
import RoundModel from "../../../src/models/rounds";

describe("Round Model", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/test");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await RoundModel.deleteMany({});
  });

  it("should create a round successfully", async () => {
    const round = new RoundModel({
      roundId: 1,
      eventID: 1,
      gameId: 1,
      homeTeam: "Team A",
      awayTeam: "Team B",
      selections: [
        {
          name: "Selection 1",
          price: 1.5,
        },
      ],
      odds: [
        {
          type: "win",
          value: 1.5,
        },
      ],
      ended: false,
      matchConfig: {
        firstHalf: { scoreRate: { "1": 0.5 } },
        secondHalf: { scoreRate: { "1": 0.5 } },
      },
    });

    const savedRound = await round.save();
    expect(savedRound._id).toBeDefined();
    expect(savedRound.roundId).toBe(1);
    expect(savedRound.eventID).toBe(1);
    expect(savedRound.gameId).toBe(1);
    expect(savedRound.homeTeam).toBe("Team A");
    expect(savedRound.awayTeam).toBe("Team B");
    expect(savedRound.selections).toHaveLength(1);
    expect(savedRound.selections[0].name).toBe("Selection 1");
    expect(savedRound.selections[0].price).toBe(1.5);
    expect(savedRound.odds).toHaveLength(1);
    expect(savedRound.odds[0].type).toBe("win");
    expect(savedRound.odds[0].value).toBe(1.5);
    expect(savedRound.ended).toBe(false);
    expect(savedRound.matchConfig).toBeDefined();
    expect(savedRound.matchConfig.firstHalf.scoreRate["1"]).toBe(0.5);
    expect(savedRound.matchConfig.secondHalf.scoreRate["1"]).toBe(0.5);
  });

  it("should fail to create a round without required fields", async () => {
    const round = new RoundModel({});

    await expect(round.save()).rejects.toThrow();
  });

  it("should fail to create a round with invalid roundId type", async () => {
    const round = new RoundModel({
      roundId: "invalid",
      eventID: 1,
      gameId: 1,
      homeTeam: "Team A",
      awayTeam: "Team B",
      selections: [],
      odds: [],
      ended: false,
    });

    await expect(round.save()).rejects.toThrow();
  });

  it("should fail to create a round with invalid ended type", async () => {
    const round = new RoundModel({
      roundId: 1,
      eventID: 1,
      gameId: 1,
      homeTeam: "Team A",
      awayTeam: "Team B",
      selections: [],
      odds: [],
      ended: "invalid",
    });

    await expect(round.save()).rejects.toThrow();
  });
});
