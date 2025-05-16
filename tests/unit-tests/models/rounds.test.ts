import RoundModel from "../../../src/models/rounds";

describe("Round Model", () => {
  it("should create model with default properties", () => {
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

    expect(round.roundId).toBe(1);
    expect(round.eventID).toBe(1);
    expect(round.gameId).toBe(1);
    expect(round.homeTeam).toBe("Team A");
    expect(round.awayTeam).toBe("Team B");
    expect(round.selections).toHaveLength(1);
    expect(round.selections[0].name).toBe("Selection 1");
    expect(round.selections[0].price).toBe(1.5);
    expect(round.odds).toHaveLength(1);
    expect(round.odds[0].type).toBe("win");
    expect(round.odds[0].value).toBe(1.5);
    expect(round.ended).toBe(false);
    expect(round.matchConfig).toBeDefined();
    expect(round.matchConfig.firstHalf.scoreRate["1"]).toBe(0.5);
    expect(round.matchConfig.secondHalf.scoreRate["1"]).toBe(0.5);
  });

  it("should verify required properties", () => {
    const round = new RoundModel({});

    const validationError = round.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("roundId");
    expect(validationError?.errors).toHaveProperty("eventID");
    expect(validationError?.errors).toHaveProperty("gameId");
    expect(validationError?.errors).toHaveProperty("homeTeam");
    expect(validationError?.errors).toHaveProperty("awayTeam");
  });

  it("should verify selection required properties", () => {
    const round = new RoundModel({
      roundId: 1,
      eventID: 1,
      gameId: 1,
    });

    const validationError = round.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("homeTeam");
    expect(validationError?.errors).toHaveProperty("awayTeam");
  });
});
