import { createRoundModel } from "../../../src/models/rounds";

describe("Round Model tests", () => {
  const RoundModel = createRoundModel({
    modelPrefix: "2001",
  } as any);
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
        gameTiming: {
          wholeRound: 300000,
          timelines: [
            { OddsAvailable: 0, ScheduleStart: 60000, ResultAvailable: 120000 },
            { OddsAvailable: 0, ScheduleStart: 180000, ResultAvailable: 240000 },
          ],
        },
        numberOfEventDetails: 2,
        eventDetailInfos: [
          {
            rateConfig: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } },
            oddsInfo: { handicapValue: 0.5, overUnderValue: 1.5, homeOverUnderValue: 0.5, awayOverUnderValue: 0.5 },
            phase: 0,
          },
          {
            rateConfig: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } },
            oddsInfo: { handicapValue: 0, overUnderValue: 0.5, homeOverUnderValue: 0.5, awayOverUnderValue: 0.5 },
            phase: 1,
          },
        ],
        rateConfig: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } },
        oddsInfo: { handicapValue: 0.5, overUnderValue: 2.5, homeOverUnderValue: 1.5, awayOverUnderValue: 1.5 },
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
    expect(round.matchConfig.gameTiming).toBeDefined();
    expect(round.matchConfig.numberOfEventDetails).toBe(2);
    expect(round.matchConfig.eventDetailInfos).toHaveLength(2);
    expect(round.matchConfig.eventDetailInfos[0].rateConfig.scoreRate["1-0"]).toBe(0.5);
    expect(round.matchConfig.eventDetailInfos[1].rateConfig.scoreRate["1-0"]).toBe(0.5);
    expect(round.matchConfig.eventDetailInfos[0].phase).toBe(0);
    expect(round.matchConfig.eventDetailInfos[1].phase).toBe(1);
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
