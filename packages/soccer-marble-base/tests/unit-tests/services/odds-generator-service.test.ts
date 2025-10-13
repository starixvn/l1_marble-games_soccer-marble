import { OddsGeneratorService } from "../../../src/services/odds-generator-service";
import { SettlementStatus, FirstHalfOddsKey, FullTimeOddsKey } from "../../../src/types";

describe("OddsGeneratorService Tests", () => {
  const oddsGeneratorService = new OddsGeneratorService();

  describe("calculateProbabilitiesForBetChoices", () => {
    it("should calculate probabilities for different bet choices", () => {
      const scoreRates = {
        "1-0": 0.4,
        "0-1": 0.3,
        "1-1": 0.3,
      };

      const result = oddsGeneratorService.calculateProbabilitiesForBetChoices(scoreRates);

      expect(result).toEqual({
        hdpHome: expect.any(Number),
        hdpAway: expect.any(Number),
        home: 0.4,
        away: 0.3,
        draw: 0.3,
        over: expect.any(Number),
        under: expect.any(Number),
        even: expect.any(Number),
        odd: expect.any(Number),
        homeOver: expect.any(Number),
        awayOver: expect.any(Number),
        homeUnder: expect.any(Number),
        awayUnder: expect.any(Number),
      });
    });

    it("should handle adding score parameter", () => {
      const scoreRates = {
        "1-0": 0.5,
        "0-1": 0.5,
      };

      const result = oddsGeneratorService.calculateProbabilitiesForBetChoices(scoreRates, "1-0");

      // With adding score 1-0, 1-0 becomes 2-0 (home win), 0-1 becomes 1-1 (draw)
      expect(result.home).toBe(0.5);
      expect(result.draw).toBe(0.5);
      expect(result.away).toBe(0);
    });

    it("should handle even/odd calculations", () => {
      const scoreRates = {
        "0-0": 0.25, // 0 goals (even)
        "1-0": 0.25, // 1 goal (odd)
        "2-0": 0.25, // 2 goals (even)
        "3-0": 0.25, // 3 goals (odd)
      };

      const result = oddsGeneratorService.calculateProbabilitiesForBetChoices(scoreRates);

      expect(result.even).toBe(0.5); // 0-0 and 2-0
      expect(result.odd).toBe(0.5); // 1-0 and 3-0
    });
  });

  describe("calculateHandicapValue", () => {
    it("should calculate handicap value based on home and away scores", () => {
      expect(oddsGeneratorService.calculateHandicapValue(2, 1)).toBe(-0.5);
      expect(oddsGeneratorService.calculateHandicapValue(1, 2)).toBe(1.5);
      expect(oddsGeneratorService.calculateHandicapValue(1, 1)).toBe(0.5);
      expect(oddsGeneratorService.calculateHandicapValue(1.2, 2)).toBe(0.5);
      expect(oddsGeneratorService.calculateHandicapValue(2, 1.2)).toBe(-0.5);
    });

    it("should handle edge cases", () => {
      expect(oddsGeneratorService.calculateHandicapValue(0, 0)).toBe(0.5);
      expect(oddsGeneratorService.calculateHandicapValue(5, 0)).toBe(-4.5);
      expect(oddsGeneratorService.calculateHandicapValue(0, 5)).toBe(5.5);
    });

    it("should handle decimal scores", () => {
      expect(oddsGeneratorService.calculateHandicapValue(1.7, 2.3)).toBe(0.5);
      expect(oddsGeneratorService.calculateHandicapValue(2.8, 1.1)).toBe(-1.5);
    });
  });

  describe("calculateOverUnderValue", () => {
    it("should calculate over/under value based on home and away scores", () => {
      expect(oddsGeneratorService.calculateOverUnderValue(2, 1)).toBe(3.5);
      expect(oddsGeneratorService.calculateOverUnderValue(1, 2)).toBe(3.5);
      expect(oddsGeneratorService.calculateOverUnderValue(1, 1)).toBe(2.5);
      expect(oddsGeneratorService.calculateOverUnderValue(1.2, 2.2)).toBe(3.5);
    });

    it("should handle edge cases", () => {
      expect(oddsGeneratorService.calculateOverUnderValue(0, 0)).toBe(0.5);
      expect(oddsGeneratorService.calculateOverUnderValue(5, 5)).toBe(10.5);
      expect(oddsGeneratorService.calculateOverUnderValue(10, 0)).toBe(10.5);
    });

    it("should handle decimal scores", () => {
      expect(oddsGeneratorService.calculateOverUnderValue(1.7, 2.3)).toBe(4.5);
      expect(oddsGeneratorService.calculateOverUnderValue(0.8, 1.2)).toBe(2.5);
    });
  });

  describe("calculateBetOdds", () => {
    it("should calculate bet odds from probabilities", () => {
      const probabilities = {
        home: 0.5,
        away: 0.3,
        draw: 0.2,
      };

      const result = oddsGeneratorService.calculateBetOdds(probabilities);

      expect(result).toEqual({
        home: 2,
        away: 3.33,
        draw: 5,
      });
    });

    it("should handle edge case probabilities", () => {
      const probabilities = {
        home: 0.1,
        away: 0.9,
      };

      const result = oddsGeneratorService.calculateBetOdds(probabilities);

      expect(result.home).toBe(10);
      expect(result.away).toBe(1.11);
    });

    it("should handle empty probabilities", () => {
      const probabilities = {};

      const result = oddsGeneratorService.calculateBetOdds(probabilities);

      expect(result).toEqual({});
    });
  });

  describe("update1X2", () => {
    it("should update counters for home win", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.update1X2(counters, 2, 1, 0.5);

      expect(counters.home).toBe(0.5);
      expect(counters.away).toBe(0);
      expect(counters.draw).toBe(0);
    });

    it("should update counters for away win", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.update1X2(counters, 1, 2, 0.3);

      expect(counters.home).toBe(0);
      expect(counters.away).toBe(0.3);
      expect(counters.draw).toBe(0);
    });

    it("should update counters for draw", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.update1X2(counters, 1, 1, 0.2);

      expect(counters.home).toBe(0);
      expect(counters.away).toBe(0);
      expect(counters.draw).toBe(0.2);
    });
  });

  describe("updateHandicap", () => {
    it("should update counters for home handicap win", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateHandicap(counters, 2, 1, -0.5, 0.4);

      expect(counters.hdpHome).toBe(0.4);
      expect(counters.hdpAway).toBe(0);
    });

    it("should update counters for away handicap win", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateHandicap(counters, 1, 2, 0.5, 0.3);

      expect(counters.hdpHome).toBe(0);
      expect(counters.hdpAway).toBe(0.3);
    });

    it("should handle handicap draw (no update)", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateHandicap(counters, 1, 1, 0, 0.2);

      expect(counters.hdpHome).toBe(0);
      expect(counters.hdpAway).toBe(0);
    });
  });

  describe("updateOverUnder", () => {
    it("should update counters for over", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateOverUnder(counters, 3, 2.5, 0.5);

      expect(counters.over).toBe(0.5);
      expect(counters.under).toBe(0);
    });

    it("should update counters for under", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateOverUnder(counters, 2, 2.5, 0.3);

      expect(counters.over).toBe(0);
      expect(counters.under).toBe(0.3);
    });

    it("should handle exact match (no update)", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateOverUnder(counters, 2, 2, 0.2);

      expect(counters.over).toBe(0);
      expect(counters.under).toBe(0);
    });
  });

  describe("updateEvenOdd", () => {
    it("should update counters for even goals", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateEvenOdd(counters, 4, 0.6);

      expect(counters.even).toBe(0.6);
      expect(counters.odd).toBe(0);
    });

    it("should update counters for odd goals", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateEvenOdd(counters, 3, 0.4);

      expect(counters.even).toBe(0);
      expect(counters.odd).toBe(0.4);
    });

    it("should handle zero goals", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateEvenOdd(counters, 0, 0.1);

      expect(counters.even).toBe(0.1);
      expect(counters.odd).toBe(0);
    });
  });

  describe("updateTeamOverUnder", () => {
    it("should update counters for home team over/under", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateTeamOverUnder(counters, 2, 1, 1.5, 0.5, 0.3);

      expect(counters.homeOver).toBe(0.3);
      expect(counters.homeUnder).toBe(0);
      expect(counters.awayOver).toBe(0.3);
      expect(counters.awayUnder).toBe(0);
    });

    it("should update counters for home team under", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateTeamOverUnder(counters, 1, 2, 1.5, 2.5, 0.4);

      expect(counters.homeOver).toBe(0);
      expect(counters.homeUnder).toBe(0.4);
      expect(counters.awayOver).toBe(0);
      expect(counters.awayUnder).toBe(0.4);
    });

    it("should handle exact matches (no update)", () => {
      const counters = {
        hdpHome: 0,
        hdpAway: 0,
        home: 0,
        away: 0,
        draw: 0,
        over: 0,
        under: 0,
        even: 0,
        odd: 0,
        homeOver: 0,
        awayOver: 0,
        homeUnder: 0,
        awayUnder: 0,
      };

      oddsGeneratorService.updateTeamOverUnder(counters, 1, 1, 1, 1, 0.2);

      expect(counters.homeOver).toBe(0);
      expect(counters.homeUnder).toBe(0);
      expect(counters.awayOver).toBe(0);
      expect(counters.awayUnder).toBe(0);
    });
  });

  describe("calculateOddsInfo", () => {
    it("should calculate odds info from score rates", () => {
      const scoreRates = {
        "1-0": 0.1118,
        "0-1": 0.1074,
        "1-1": 0.1688,
        "2-0": 0.1502,
        "0-2": 0.0496,
        "2-1": 0.097,
        "1-2": 0.075,
        "3-0": 0.0632,
        "0-3": 0.0194,
        "2-2": 0.0389,
        "3-1": 0.0638,
        "1-3": 0.0254,
        "4-0": 0.0202,
        "0-4": 0.0093,
      };

      const result = oddsGeneratorService.calculateOddsInfo(scoreRates);

      expect(result).toEqual({
        handicapValue: -0.5,
        overUnderValue: 2.5,
        homeOverUnderValue: 1.5,
        awayOverUnderValue: 0.5,
      });
    });

    it("should handle different score combinations", () => {
      const scoreRates = {
        "1-0": 0.0857,
        "0-1": 0.1193,
        "1-1": 0.1363,
        "2-0": 0.0424,
        "0-2": 0.1218,
        "2-1": 0.0766,
        "1-2": 0.1253,
        "3-0": 0.0114,
        "0-3": 0.0715,
        "2-2": 0.0663,
        "3-1": 0.0336,
        "1-3": 0.0755,
        "4-0": 0.0115,
        "0-4": 0.0228,
      };

      const result = oddsGeneratorService.calculateOddsInfo(scoreRates);

      expect(result.handicapValue).toBe(0.5);
      expect(result.overUnderValue).toBe(2.5);
      expect(result.homeOverUnderValue).toBe(0.5);
      expect(result.awayOverUnderValue).toBe(1.5);
    });
  });

  describe("calculateOddsFromRate", () => {
    it("should calculate odds from rate config", () => {
      const rateConfig = {
        scoreRate: {
          "1-0": 0.1189,
          "0-1": 0.0853,
          "1-1": 0.1353,
          "2-0": 0.1213,
          "0-2": 0.0403,
          "2-1": 0.1258,
          "1-2": 0.0773,
          "3-0": 0.0714,
          "0-3": 0.0112,
          "2-2": 0.0669,
          "3-1": 0.0786,
          "1-3": 0.0338,
          "4-0": 0.0223,
          "0-4": 0.0116,
        },
      };

      const result = oddsGeneratorService.calculateOddsFromRate(rateConfig, "0-1");

      expect(result).toEqual({
        home: 3.4,
        away: 2.16,
        draw: 4.08,
        hdpHome: 1.85,
        hdpAway: 2.16,
        over: 2,
        under: 1.99,
        odd: 1.96,
        even: 2.04,
        homeOver: 2.05,
        homeUnder: 1.94,
        awayOver: 1.5,
        awayUnder: 2.99,
      });
    });

    it("should handle adding score parameter", () => {
      const rateConfig = {
        scoreRate: {
          "1-0": 0.1189,
          "0-1": 0.0853,
          "1-1": 0.1353,
          "2-0": 0.1213,
          "0-2": 0.0403,
          "2-1": 0.1258,
          "1-2": 0.0773,
          "3-0": 0.0714,
          "0-3": 0.0112,
          "2-2": 0.0669,
          "3-1": 0.0786,
          "1-3": 0.0338,
          "4-0": 0.0223,
          "0-4": 0.0116,
        },
      };

      const result = oddsGeneratorService.calculateOddsFromRate(rateConfig, "2-0");

      expect(result).toEqual({
        home: 1.1,
        away: 43.85,
        draw: 13.49,
        hdpHome: 1.85,
        hdpAway: 2.16,
        over: 2,
        under: 1.99,
        odd: 2.04,
        even: 1.96,
        homeOver: 2.05,
        homeUnder: 1.94,
        awayOver: 1.5,
        awayUnder: 2.99,
      });
    });
  });

  describe("calculateOddsForRound", () => {
    it("should calculate odds for round with HH result", () => {
      const matchConfig = {
        gameTiming: {} as any,
        numberOfEventDetails: 2,
        eventDetailInfos: [
          {
            rateConfig: {
              scoreRate: {
                "2-1": 0.1294,
                "1-0": 0.1176,
                "2-0": 0.1176,
                "3-1": 0.0824,
                "3-0": 0.0706,
                "4-0": 0.0235,
                "1-1": 0.1293,
                "2-2": 0.0706,
                "0-1": 0.0824,
                "1-2": 0.0824,
                "0-2": 0.0353,
                "1-3": 0.0353,
                "0-3": 0.0118,
                "0-4": 0.0118,
              },
            },
            oddsInfo: {} as any,
            phase: 0,
          },
          {
            rateConfig: {
              scoreRate: {
                "2-1": 0.1294,
                "1-0": 0.1176,
                "2-0": 0.1176,
                "3-1": 0.0824,
                "3-0": 0.0706,
                "4-0": 0.0235,
                "1-1": 0.1293,
                "2-2": 0.0706,
                "0-1": 0.0824,
                "1-2": 0.0824,
                "0-2": 0.0353,
                "1-3": 0.0353,
                "0-3": 0.0118,
                "0-4": 0.0118,
              },
            },
            oddsInfo: {} as any,
            phase: 1,
          },
        ],
        rateConfig: {
          scoreRate: {
            "2-1": 0.1294,
            "1-0": 0.1176,
            "2-0": 0.1176,
            "3-1": 0.0824,
            "3-0": 0.0706,
            "4-0": 0.0235,
            "1-1": 0.1293,
            "2-2": 0.0706,
            "0-1": 0.0824,
            "1-2": 0.0824,
            "0-2": 0.0353,
            "1-3": 0.0353,
            "0-3": 0.0118,
            "0-4": 0.0118,
          },
        },
        oddsInfo: {} as any,
      } as any;

      const roundResult = [
        {
          result: {
            goalSequence: "HH",
          },
        },
      ];

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, roundResult as any);

      expect(result).toHaveLength(2);
    });

    it("should calculate odds for round with HA result", () => {
      const matchConfig = {
        gameTiming: {} as any,
        numberOfEventDetails: 2,
        eventDetailInfos: [
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.5,
                "0-1": 0.5,
              },
            },
            oddsInfo: {} as any,
            phase: 0,
          },
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.5,
                "0-1": 0.5,
              },
            },
            oddsInfo: {} as any,
            phase: 1,
          },
        ],
        rateConfig: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        oddsInfo: {} as any,
      } as any;

      const roundResult = [
        {
          result: {
            goalSequence: "HA",
          },
        },
      ];

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, roundResult as any);

      expect(result).toHaveLength(2);
    });

    it("should calculate odds for round with AA result", () => {
      const matchConfig = {
        gameTiming: {} as any,
        numberOfEventDetails: 2,
        eventDetailInfos: [
          {
            rateConfig: {
              scoreRate: {
                "0-1": 0.6,
                "0-2": 0.4,
              },
            },
            oddsInfo: {} as any,
            phase: 0,
          },
          {
            rateConfig: {
              scoreRate: {
                "0-1": 0.6,
                "0-2": 0.4,
              },
            },
            oddsInfo: {} as any,
            phase: 1,
          },
        ],
        rateConfig: {
          scoreRate: {
            "0-1": 0.6,
            "0-2": 0.4,
          },
        },
        oddsInfo: {} as any,
      } as any;

      const roundResult = [
        {
          result: {
            goalSequence: "AA",
          },
        },
      ];

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, roundResult as any);

      expect(result).toHaveLength(2);
    });

    it("should handle complex first half results", () => {
      const matchConfig = {
        gameTiming: {} as any,
        numberOfEventDetails: 2,
        eventDetailInfos: [
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.5,
                "0-1": 0.5,
              },
            },
            oddsInfo: {} as any,
            phase: 0,
          },
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.5,
                "0-1": 0.5,
              },
            },
            oddsInfo: {} as any,
            phase: 1,
          },
        ],
        rateConfig: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        oddsInfo: {} as any,
      } as any;

      const roundResult = [
        {
          result: {
            goalSequence: "HHHAA",
          },
        },
      ];

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, roundResult as any);

      expect(result).toHaveLength(2);
    });
  });

  describe("generateFirstHalfSelections", () => {
    it("should generate first half selections with correct structure", () => {
      const allFirstHalfOdds = {
        [FirstHalfOddsKey.H1_HDP_HOME]: 1.5,
        [FirstHalfOddsKey.H1_HDP_AWAY]: 2.5,
        [FirstHalfOddsKey.H1_1X2_HOME]: 2.0,
        [FirstHalfOddsKey.H1_1X2_AWAY]: 3.0,
        [FirstHalfOddsKey.H1_1X2_DRAW]: 3.5,
        [FirstHalfOddsKey.H1_OU_OVER]: 1.8,
        [FirstHalfOddsKey.H1_OU_UNDER]: 2.0,
        [FirstHalfOddsKey.H1_OE_ODD]: 1.9,
        [FirstHalfOddsKey.H1_OE_EVEN]: 1.9,
        [FirstHalfOddsKey.H1_HOME_OVER]: 2.2,
        [FirstHalfOddsKey.H1_HOME_UNDER]: 1.7,
        [FirstHalfOddsKey.H1_AWAY_OVER]: 2.1,
        [FirstHalfOddsKey.H1_AWAY_UNDER]: 1.8,
        [FullTimeOddsKey.FT_HDP_HOME]: 1.6,
        [FullTimeOddsKey.FT_HDP_AWAY]: 2.4,
        [FullTimeOddsKey.FT_1X2_HOME]: 2.1,
        [FullTimeOddsKey.FT_1X2_AWAY]: 2.9,
        [FullTimeOddsKey.FT_1X2_DRAW]: 3.4,
        [FullTimeOddsKey.FT_OU_OVER]: 1.7,
        [FullTimeOddsKey.FT_OU_UNDER]: 2.1,
        [FullTimeOddsKey.FT_OE_ODD]: 1.8,
        [FullTimeOddsKey.FT_OE_EVEN]: 2.0,
        [FullTimeOddsKey.FT_HOME_OVER]: 2.0,
        [FullTimeOddsKey.FT_HOME_UNDER]: 1.8,
        [FullTimeOddsKey.FT_AWAY_OVER]: 2.3,
        [FullTimeOddsKey.FT_AWAY_UNDER]: 1.7,
      };

      const matchConfig = {
        eventDetailInfos: [
          {
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 2.5,
              homeOverUnderValue: 1.5,
              awayOverUnderValue: 1.0,
            },
          },
        ],
        oddsInfo: {
          handicapValue: -0.5,
          overUnderValue: 3.5,
          homeOverUnderValue: 2.0,
          awayOverUnderValue: 1.5,
        },
      } as any;

      const result = oddsGeneratorService.generateFirstHalfSelections(allFirstHalfOdds, matchConfig);

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(26);

      // Check that all selections have the correct structure
      Object.values(result).forEach((selection) => {
        expect(selection).toHaveProperty("name");
        expect(selection).toHaveProperty("price");
        expect(selection).toHaveProperty("point");
        expect(selection).toHaveProperty("settlementStatus");
        expect(selection.settlementStatus).toBe(SettlementStatus.PLAY);
      });

      // Check specific point values
      expect(result[FullTimeOddsKey.FT_HDP_HOME].point).toBe(-0.5);
      expect(result[FullTimeOddsKey.FT_HDP_AWAY].point).toBe(0.5);
      expect(result[FirstHalfOddsKey.H1_HDP_HOME].point).toBe(0.5);
      expect(result[FirstHalfOddsKey.H1_HDP_AWAY].point).toBe(-0.5);
    });
  });

  describe("generateSecondHalfSelections", () => {
    it("should generate second half selections with correct structure", () => {
      const allSecondHalfOdds = {
        [FullTimeOddsKey.FT_1X2_HOME]: 2.0,
        [FullTimeOddsKey.FT_1X2_AWAY]: 3.0,
        [FullTimeOddsKey.FT_1X2_DRAW]: 3.5,
        [FullTimeOddsKey.FT_HDP_HOME]: 1.5,
        [FullTimeOddsKey.FT_HDP_AWAY]: 2.5,
        [FullTimeOddsKey.FT_OU_OVER]: 1.8,
        [FullTimeOddsKey.FT_OU_UNDER]: 2.0,
        [FullTimeOddsKey.FT_OE_ODD]: 1.9,
        [FullTimeOddsKey.FT_OE_EVEN]: 1.9,
        [FullTimeOddsKey.FT_HOME_OVER]: 2.2,
        [FullTimeOddsKey.FT_HOME_UNDER]: 1.7,
        [FullTimeOddsKey.FT_AWAY_OVER]: 2.1,
        [FullTimeOddsKey.FT_AWAY_UNDER]: 1.8,
      };

      const matchConfig = {
        eventDetailInfos: [
          {},
          {
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 2.5,
              homeOverUnderValue: 1.5,
              awayOverUnderValue: 1.0,
            },
          },
        ],
      } as any;

      const result = [
        {
          result: {
            goalSequence: "HH",
          },
        },
      ] as any;

      const selections = oddsGeneratorService.generateSecondHalfSelections(allSecondHalfOdds, matchConfig, result);

      expect(selections).toBeDefined();
      expect(Object.keys(selections)).toHaveLength(13);

      // Check that all selections have the correct structure
      Object.values(selections).forEach((selection) => {
        expect(selection).toHaveProperty("name");
        expect(selection).toHaveProperty("price");
        expect(selection).toHaveProperty("point");
        expect(selection).toHaveProperty("settlementStatus");
        expect(selection.settlementStatus).toBe(SettlementStatus.PLAY);
      });

      // Check specific point values (HH = 2 home goals, 0 away goals)
      expect(selections[FullTimeOddsKey.FT_HDP_HOME].point).toBe(0.5);
      expect(selections[FullTimeOddsKey.FT_HDP_AWAY].point).toBe(-0.5);
      expect(selections[FullTimeOddsKey.FT_OU_OVER].point).toBe(4.5); // 2.5 + 2
      expect(selections[FullTimeOddsKey.FT_OU_UNDER].point).toBe(4.5); // 2.5 + 2
      expect(selections[FullTimeOddsKey.FT_HOME_OVER].point).toBe(3.5); // 1.5 + 2
      expect(selections[FullTimeOddsKey.FT_HOME_UNDER].point).toBe(3.5); // 1.5 + 2
      expect(selections[FullTimeOddsKey.FT_AWAY_OVER].point).toBe(1.0); // 1.0 + 0
      expect(selections[FullTimeOddsKey.FT_AWAY_UNDER].point).toBe(1.0); // 1.0 + 0
    });
  });

  describe("generateSelectionsForRound", () => {
    it("should generate selections for both halves", () => {
      const odds: Record<string, number>[] = [
        {
          [FirstHalfOddsKey.H1_HDP_HOME]: 1.5,
          [FirstHalfOddsKey.H1_HDP_AWAY]: 2.5,
          [FirstHalfOddsKey.H1_1X2_HOME]: 2.0,
          [FirstHalfOddsKey.H1_1X2_AWAY]: 3.0,
          [FirstHalfOddsKey.H1_1X2_DRAW]: 3.5,
          [FirstHalfOddsKey.H1_OU_OVER]: 1.8,
          [FirstHalfOddsKey.H1_OU_UNDER]: 2.0,
          [FirstHalfOddsKey.H1_OE_ODD]: 1.9,
          [FirstHalfOddsKey.H1_OE_EVEN]: 1.9,
          [FirstHalfOddsKey.H1_HOME_OVER]: 2.2,
          [FirstHalfOddsKey.H1_HOME_UNDER]: 1.7,
          [FirstHalfOddsKey.H1_AWAY_OVER]: 2.1,
          [FirstHalfOddsKey.H1_AWAY_UNDER]: 1.8,
          [FullTimeOddsKey.FT_HDP_HOME]: 1.6,
          [FullTimeOddsKey.FT_HDP_AWAY]: 2.4,
          [FullTimeOddsKey.FT_1X2_HOME]: 2.1,
          [FullTimeOddsKey.FT_1X2_AWAY]: 2.9,
          [FullTimeOddsKey.FT_1X2_DRAW]: 3.4,
          [FullTimeOddsKey.FT_OU_OVER]: 1.7,
          [FullTimeOddsKey.FT_OU_UNDER]: 2.1,
          [FullTimeOddsKey.FT_OE_ODD]: 1.8,
          [FullTimeOddsKey.FT_OE_EVEN]: 2.0,
          [FullTimeOddsKey.FT_HOME_OVER]: 2.0,
          [FullTimeOddsKey.FT_HOME_UNDER]: 1.8,
          [FullTimeOddsKey.FT_AWAY_OVER]: 2.3,
          [FullTimeOddsKey.FT_AWAY_UNDER]: 1.7,
        } as Record<string, number>,
        {
          [FullTimeOddsKey.FT_1X2_HOME]: 2.0,
          [FullTimeOddsKey.FT_1X2_AWAY]: 3.0,
          [FullTimeOddsKey.FT_1X2_DRAW]: 3.5,
          [FullTimeOddsKey.FT_HDP_HOME]: 1.5,
          [FullTimeOddsKey.FT_HDP_AWAY]: 2.5,
          [FullTimeOddsKey.FT_OU_OVER]: 1.8,
          [FullTimeOddsKey.FT_OU_UNDER]: 2.0,
          [FullTimeOddsKey.FT_OE_ODD]: 1.9,
          [FullTimeOddsKey.FT_OE_EVEN]: 1.9,
          [FullTimeOddsKey.FT_HOME_OVER]: 2.2,
          [FullTimeOddsKey.FT_HOME_UNDER]: 1.7,
          [FullTimeOddsKey.FT_AWAY_OVER]: 2.1,
          [FullTimeOddsKey.FT_AWAY_UNDER]: 1.8,
        } as Record<string, number>,
      ];

      const oddsInfo = {
        eventDetailInfos: [
          {
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 2.5,
              homeOverUnderValue: 1.5,
              awayOverUnderValue: 1.0,
            },
          },
          {
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 2.5,
              homeOverUnderValue: 1.5,
              awayOverUnderValue: 1.0,
            },
          },
        ],
        oddsInfo: {
          handicapValue: -0.5,
          overUnderValue: 3.5,
          homeOverUnderValue: 2.0,
          awayOverUnderValue: 1.5,
        },
      } as any;

      const result = [
        {
          result: {
            goalSequence: "HH",
          },
        },
      ] as any;

      const selections = oddsGeneratorService.generateSelectionsForRound(odds, oddsInfo, result);

      expect(selections).toHaveLength(2);
      expect(selections[0]).toBeDefined();
      expect(selections[1]).toBeDefined();
    });
  });

  describe("calculateOddsForFirstHalf", () => {
    it("should calculate odds for first half with correct structure", () => {
      const matchConfig = {
        rateConfig: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        eventDetailInfos: [
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.6,
                "0-1": 0.4,
              },
            },
          },
        ],
      } as any;

      const result = oddsGeneratorService.calculateOddsForFirstHalf(matchConfig);

      expect(result).toHaveProperty(FirstHalfOddsKey.H1_HDP_HOME);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_HDP_AWAY);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_1X2_HOME);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_1X2_AWAY);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_1X2_DRAW);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_OU_OVER);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_OU_UNDER);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_OE_ODD);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_OE_EVEN);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_HOME_OVER);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_HOME_UNDER);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_AWAY_OVER);
      expect(result).toHaveProperty(FirstHalfOddsKey.H1_AWAY_UNDER);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_HDP_HOME);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_HDP_AWAY);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_1X2_HOME);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_1X2_AWAY);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_1X2_DRAW);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_OU_OVER);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_OU_UNDER);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_OE_ODD);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_OE_EVEN);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_HOME_OVER);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_HOME_UNDER);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_AWAY_OVER);
      expect(result).toHaveProperty(FullTimeOddsKey.FT_AWAY_UNDER);
    });
  });

  describe("calculateOddsForSecondHalf", () => {
    it("should calculate odds for second half with correct structure", () => {
      const matchConfig = {
        eventDetailInfos: [
          {},
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.5,
                "0-1": 0.5,
              },
            },
          },
        ],
      } as any;

      const result = [
        {
          result: {
            goalSequence: "HH",
          },
        },
      ] as any;

      const odds = oddsGeneratorService.calculateOddsForSecondHalf(matchConfig, result);

      expect(odds).toHaveProperty(FullTimeOddsKey.FT_1X2_HOME);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_1X2_AWAY);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_1X2_DRAW);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_HDP_HOME);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_HDP_AWAY);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_OU_OVER);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_OU_UNDER);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_OE_ODD);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_OE_EVEN);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_HOME_OVER);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_HOME_UNDER);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_AWAY_OVER);
      expect(odds).toHaveProperty(FullTimeOddsKey.FT_AWAY_UNDER);
    });

    it("should handle different first half results", () => {
      const matchConfig = {
        eventDetailInfos: [
          {},
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.5,
                "0-1": 0.5,
              },
            },
          },
        ],
      } as any;

      const resultHA = [
        {
          result: {
            goalSequence: "HA",
          },
        },
      ] as any;

      const resultAA = [
        {
          result: {
            goalSequence: "AA",
          },
        },
      ] as any;

      const oddsHA = oddsGeneratorService.calculateOddsForSecondHalf(matchConfig, resultHA);
      const oddsAA = oddsGeneratorService.calculateOddsForSecondHalf(matchConfig, resultAA);

      expect(oddsHA).toBeDefined();
      expect(oddsAA).toBeDefined();
      expect(oddsHA).not.toEqual(oddsAA);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle negative scores in calculateHandicapValue", () => {
      expect(oddsGeneratorService.calculateHandicapValue(-1, 1)).toBe(2.5);
      expect(oddsGeneratorService.calculateHandicapValue(1, -1)).toBe(-1.5);
      expect(oddsGeneratorService.calculateHandicapValue(-1, -1)).toBe(0.5);
    });

    it("should handle negative scores in calculateOverUnderValue", () => {
      expect(oddsGeneratorService.calculateOverUnderValue(-1, 1)).toBe(0.5);
      expect(oddsGeneratorService.calculateOverUnderValue(1, -1)).toBe(0.5);
      expect(oddsGeneratorService.calculateOverUnderValue(-1, -1)).toBe(-1.5);
    });

    it("should handle very large numbers in calculateHandicapValue", () => {
      expect(oddsGeneratorService.calculateHandicapValue(1000, 1001)).toBe(1.5);
      expect(oddsGeneratorService.calculateHandicapValue(1001, 1000)).toBe(-0.5);
    });

    it("should handle very large numbers in calculateOverUnderValue", () => {
      expect(oddsGeneratorService.calculateOverUnderValue(1000, 1001)).toBe(2001.5);
      expect(oddsGeneratorService.calculateOverUnderValue(1001, 1000)).toBe(2001.5);
    });

    it("should handle decimal precision in calculateHandicapValue", () => {
      expect(oddsGeneratorService.calculateHandicapValue(1.999, 2.001)).toBe(0.5);
      expect(oddsGeneratorService.calculateHandicapValue(2.001, 1.999)).toBe(-0.5);
    });

    it("should handle decimal precision in calculateOverUnderValue", () => {
      expect(oddsGeneratorService.calculateOverUnderValue(1.999, 2.001)).toBe(4.5);
      expect(oddsGeneratorService.calculateOverUnderValue(2.001, 1.999)).toBe(4.5);
    });

    it("should handle invalid addingScore format", () => {
      const scoreRates = {
        "1-0": 0.5,
        "0-1": 0.5,
      };

      // parseScore will return [NaN, NaN] for invalid format, which should be handled gracefully
      const result = oddsGeneratorService.calculateProbabilitiesForBetChoices(scoreRates, "invalid");
      expect(result).toBeDefined();
    });

    it("should handle empty probabilities in calculateBetOdds", () => {
      const probabilities = {};

      const result = oddsGeneratorService.calculateBetOdds(probabilities);

      expect(result).toEqual({});
    });

    it("should handle probabilities with zero values", () => {
      const probabilities = {
        home: 0,
        away: 0.5,
        draw: 0.5,
      };

      const result = oddsGeneratorService.calculateBetOdds(probabilities);

      expect(result.home).toBe(0); // probabilityToBetRawOdds returns 0 for prob <= 0
      expect(result.away).toBe(2);
      expect(result.draw).toBe(2);
    });
  });
});
