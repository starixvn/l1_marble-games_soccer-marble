import { OddsGeneratorService } from "../../../src/services/odds-generator-service";
import { FirstHalfOddsKey, SecondHalfOddsKey, SettlementStatus } from "../../../src/types";

describe("OddsHelper Tests", () => {
  const oddsGeneratorService = new OddsGeneratorService();
  describe("parseScore", () => {
    it("should parse a simple score string into an array of numbers", () => {
      expect(oddsGeneratorService.parseScore("1-0")).toEqual([1, 0]);
      expect(oddsGeneratorService.parseScore("0-1")).toEqual([0, 1]);
      expect(oddsGeneratorService.parseScore("2-2")).toEqual([2, 2]);
    });

    it("should handle high-scoring matches", () => {
      expect(oddsGeneratorService.parseScore("5-3")).toEqual([5, 3]);
      expect(oddsGeneratorService.parseScore("7-0")).toEqual([7, 0]);
      expect(oddsGeneratorService.parseScore("0-8")).toEqual([0, 8]);
    });

    it("should handle single-digit scores", () => {
      expect(oddsGeneratorService.parseScore("0-0")).toEqual([0, 0]);
      expect(oddsGeneratorService.parseScore("1-1")).toEqual([1, 1]);
      expect(oddsGeneratorService.parseScore("9-9")).toEqual([9, 9]);
    });

    it("should handle double-digit scores", () => {
      expect(oddsGeneratorService.parseScore("10-5")).toEqual([10, 5]);
      expect(oddsGeneratorService.parseScore("15-12")).toEqual([15, 12]);
    });
  });

  describe("roundToPrecision", () => {
    it("should round to 2 decimal places with default precision", () => {
      expect(oddsGeneratorService.roundToPrecision(1.256)).toBe(1.25);
      expect(oddsGeneratorService.roundToPrecision(2.99)).toBe(2.99);
      expect(oddsGeneratorService.roundToPrecision(3.505)).toBe(3.5);
    });

    it("should round using custom precision values", () => {
      expect(oddsGeneratorService.roundToPrecision(1.256, 10)).toBe(1.2);
      expect(oddsGeneratorService.roundToPrecision(2.998, 1000)).toBe(2.998);
      expect(oddsGeneratorService.roundToPrecision(3.505, 1)).toBe(3);
    });

    it("should handle edge cases", () => {
      expect(oddsGeneratorService.roundToPrecision(0)).toBe(0);
      expect(oddsGeneratorService.roundToPrecision(-1.235)).toBe(-1.24);
      expect(oddsGeneratorService.roundToPrecision(1000000.125)).toBe(1000000.12);
    });

    it("should handle very small numbers", () => {
      expect(oddsGeneratorService.roundToPrecision(0.001, 1000)).toBe(0.001);
      expect(oddsGeneratorService.roundToPrecision(0.0001, 10000)).toBe(0.0001);
    });
  });

  describe("calculateFullTimeScoreRates", () => {
    it("should calculate full time score rates from first and second half rates", () => {
      const firstHalf = {
        scoreRate: {
          "1-0": 0.5,
          "0-1": 0.5,
        },
      };
      const secondHalf = {
        scoreRate: {
          "1-0": 0.5,
          "0-1": 0.5,
        },
      };

      const result = oddsGeneratorService.calculateFullTimeScoreRates(firstHalf, secondHalf);

      expect(result).toEqual({
        "2-0": 0.25,
        "1-1": 0.5, // Combined probability for both 1-1 scenarios
        "0-2": 0.25,
      });
    });
  });

  describe("calculateProbabilitiesForBetChoices", () => {
    it("should calculate probabilities for different bet choices", () => {
      const scoreRates = {
        "1-0": 0.4,
        "0-1": 0.3,
        "1-1": 0.3,
      };

      const result = oddsGeneratorService.calculateProbabilitiesForBetChoices(scoreRates);

      expect(result.probabilities).toEqual({
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
      expect(result.overUnderValue).toBeDefined();
      expect(result.handicapValue).toBeDefined();
      expect(result.homeOverUnderValue).toBeDefined();
      expect(result.awayOverUnderValue).toBeDefined();
    });

    it("should handle adding score parameter", () => {
      const scoreRates = {
        "1-0": 0.5,
        "0-1": 0.5,
      };

      const result = oddsGeneratorService.calculateProbabilitiesForBetChoices(scoreRates, "1-0");

      // With adding score 1-0, 1-0 becomes 2-0 (home win), 0-1 becomes 1-1 (draw)
      expect(result.probabilities.home).toBe(0.5);
      expect(result.probabilities.draw).toBe(0.5);
      expect(result.probabilities.away).toBe(0);
    });

    it("should handle even/odd calculations", () => {
      const scoreRates = {
        "0-0": 0.25, // 0 goals (even)
        "1-0": 0.25, // 1 goal (odd)
        "2-0": 0.25, // 2 goals (even)
        "3-0": 0.25, // 3 goals (odd)
      };

      const result = oddsGeneratorService.calculateProbabilitiesForBetChoices(scoreRates);

      expect(result.probabilities.even).toBe(0.5); // 0-0 and 2-0
      expect(result.probabilities.odd).toBe(0.5); // 1-0 and 3-0
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

  describe("probabilityToBetRawOdds", () => {
    it("should convert probability to bet odds", () => {
      expect(oddsGeneratorService.probabilityToBetRawOdds(0.5)).toBe(2);
      expect(oddsGeneratorService.probabilityToBetRawOdds(0.25)).toBe(4);
      expect(oddsGeneratorService.probabilityToBetRawOdds(0.1)).toBe(10);
    });

    it("should handle edge cases", () => {
      expect(oddsGeneratorService.probabilityToBetRawOdds(0)).toBe(0);
      expect(oddsGeneratorService.probabilityToBetRawOdds(1)).toBe(0);
      expect(oddsGeneratorService.probabilityToBetRawOdds(0.01)).toBe(100);
      expect(oddsGeneratorService.probabilityToBetRawOdds(0.99)).toBe(1.01);
    });

    it("should handle invalid probabilities", () => {
      expect(oddsGeneratorService.probabilityToBetRawOdds(-0.1)).toBe(0);
      expect(oddsGeneratorService.probabilityToBetRawOdds(1.1)).toBe(0);
    });
  });

  describe("calculateAverageScore", () => {
    it("should calculate average scores from score rates", () => {
      const scoreRates = {
        "1-0": 0.4,
        "0-1": 0.3,
        "1-1": 0.3,
      };

      const result = oddsGeneratorService.calculateAverageScore(scoreRates);

      expect(result.homeScore).toBeCloseTo(0.7, 4);
      expect(result.awayScore).toBeCloseTo(0.6, 4);
    });

    it("should handle single score rate", () => {
      const scoreRates = {
        "2-1": 1.0,
      };

      const result = oddsGeneratorService.calculateAverageScore(scoreRates);

      expect(result.homeScore).toBe(2);
      expect(result.awayScore).toBe(1);
    });

    it("should handle zero scores", () => {
      const scoreRates = {
        "0-0": 1.0,
      };

      const result = oddsGeneratorService.calculateAverageScore(scoreRates);

      expect(result.homeScore).toBe(0);
      expect(result.awayScore).toBe(0);
    });

    it("should handle high scoring rates", () => {
      const scoreRates = {
        "5-3": 0.5,
        "3-5": 0.5,
      };

      const result = oddsGeneratorService.calculateAverageScore(scoreRates);

      expect(result.homeScore).toBe(4);
      expect(result.awayScore).toBe(4);
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

  describe("calculateFulltimeOdds", () => {
    it("should calculate full time odds from match config", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        secondHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
      } as any;

      const result = oddsGeneratorService.calculateFulltimeOdds(matchConfig);

      expect(result).toEqual({
        odds: expect.any(Object),
        overUnderValue: expect.any(Number),
        handicapValue: expect.any(Number),
        homeOverUnderValue: expect.any(Number),
        awayOverUnderValue: expect.any(Number),
      });
    });

    it("should handle complex match config", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "2-1": 0.3,
            "1-0": 0.4,
            "0-1": 0.3,
          },
        },
        secondHalf: {
          scoreRate: {
            "1-1": 0.5,
            "2-0": 0.3,
            "0-2": 0.2,
          },
        },
      } as any;

      const result = oddsGeneratorService.calculateFulltimeOdds(matchConfig);

      expect(result.odds).toBeDefined();
      expect(result.overUnderValue).toBeDefined();
      expect(result.handicapValue).toBeDefined();
    });
  });

  describe("calculateHalfOdds", () => {
    it("should calculate half odds from half config", () => {
      const halfConfig = {
        scoreRate: {
          "1-0": 0.5,
          "0-1": 0.5,
        },
      };

      const result = oddsGeneratorService.calculateHalfOdds(halfConfig);

      expect(result).toEqual({
        odds: expect.any(Object),
        overUnderValue: expect.any(Number),
        handicapValue: expect.any(Number),
        homeOverUnderValue: expect.any(Number),
        awayOverUnderValue: expect.any(Number),
      });
    });

    it("should handle adding score parameter", () => {
      const halfConfig = {
        scoreRate: {
          "1-0": 0.5,
          "0-1": 0.5,
        },
      };

      const result = oddsGeneratorService.calculateHalfOdds(halfConfig, "1-0");

      expect(result).toEqual({
        odds: expect.any(Object),
        overUnderValue: expect.any(Number),
        handicapValue: expect.any(Number),
        homeOverUnderValue: expect.any(Number),
        awayOverUnderValue: expect.any(Number),
      });
    });
  });

  describe("calculateOddsForRound", () => {
    it("should calculate odds for round with HH result", () => {
      const matchConfig = {
        firstHalf: {
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
        secondHalf: {
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
      } as any;

      const firstHalfScore = "HH";

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfScore);

      expect(result).toHaveProperty("odds");
      expect(result).toHaveProperty("matchConfig");
      expect(result).toHaveProperty("selections");
      expect(result.odds).toHaveLength(2);
      expect(result.selections).toHaveLength(2);
    });

    it("should calculate odds for round with HA result", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        secondHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
      } as any;

      const firstHalfScore = "HA";

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfScore);

      expect(result.odds).toHaveLength(2);
      expect(result.selections).toHaveLength(2);

      // Check that selections have correct structure
      const firstHalfSelections = result.selections[0];
      expect(firstHalfSelections[FirstHalfOddsKey.H1_1X2_HOME]).toBeDefined();
      expect(firstHalfSelections[FirstHalfOddsKey.H1_1X2_HOME].settlementStatus).toBe(SettlementStatus.PLAY);
    });

    it("should calculate odds for round with AA result", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "0-1": 0.6,
            "0-2": 0.4,
          },
        },
        secondHalf: {
          scoreRate: {
            "0-1": 0.6,
            "0-2": 0.4,
          },
        },
      } as any;

      const firstHalfScore = "AA";

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfScore);

      expect(result.odds).toHaveLength(2);
      expect(result.selections).toHaveLength(2);
    });

    it("should handle complex first half results", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        secondHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
      } as any;

      const firstHalfScore = "HHHAA"; // 3 home goals, 2 away goals

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfScore);

      expect(result.odds).toHaveLength(2);
      expect(result.selections).toHaveLength(2);
    });

    it("should set correct points for handicap selections", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        secondHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
      } as any;

      const firstHalfScore = "H";

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfScore);

      const firstHalfSelections = result.selections[0];
      expect(firstHalfSelections[FirstHalfOddsKey.FT_HDP_HOME].point).toBeDefined();
      expect(firstHalfSelections[FirstHalfOddsKey.FT_HDP_AWAY].point).toBeDefined();
      expect(firstHalfSelections[FirstHalfOddsKey.H1_HDP_HOME].point).toBeDefined();
      expect(firstHalfSelections[FirstHalfOddsKey.H1_HDP_AWAY].point).toBeDefined();
    });

    it("should set correct points for over/under selections", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        secondHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
      } as any;

      const firstHalfScore = "HH";

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfScore);

      const firstHalfSelections = result.selections[0];
      const secondHalfSelections = result.selections[1];

      expect(firstHalfSelections[FirstHalfOddsKey.FT_OU_OVER].point).toBeDefined();
      expect(firstHalfSelections[FirstHalfOddsKey.FT_OU_UNDER].point).toBeDefined();
      expect(secondHalfSelections[SecondHalfOddsKey.FT_OU_OVER].point).toBeDefined();
      expect(secondHalfSelections[SecondHalfOddsKey.FT_OU_UNDER].point).toBeDefined();
    });

    it("should handle even/odd calculations correctly for second half", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        secondHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
      } as any;

      // Test with odd number of goals in first half
      const oddFirstHalfScore = "H";
      const oddResult = oddsGeneratorService.calculateOddsForRound(matchConfig, oddFirstHalfScore);

      // Test with even number of goals in first half
      const evenFirstHalfScore = "HH";
      const evenResult = oddsGeneratorService.calculateOddsForRound(matchConfig, evenFirstHalfScore);

      expect(oddResult.odds[1][SecondHalfOddsKey.FT_OE_ODD]).toBeDefined();
      expect(oddResult.odds[1][SecondHalfOddsKey.FT_OE_EVEN]).toBeDefined();
      expect(evenResult.odds[1][SecondHalfOddsKey.FT_OE_ODD]).toBeDefined();
      expect(evenResult.odds[1][SecondHalfOddsKey.FT_OE_EVEN]).toBeDefined();
    });

    it("should update match config with calculated values", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        secondHalf: {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
      } as any;

      const firstHalfScore = "H";

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfScore);

      expect(result.matchConfig.overUnderValue).toBeDefined();
      expect(result.matchConfig.handicapValue).toBeDefined();
      expect(result.matchConfig.homeOverUnderValue).toBeDefined();
      expect(result.matchConfig.awayOverUnderValue).toBeDefined();
      expect(result.matchConfig.firstHalf.overUnderValue).toBeDefined();
      expect(result.matchConfig.secondHalf.overUnderValue).toBeDefined();
    });

    it("should calculate odds as old data", () => {
      const matchConfig = {
        firstHalf: {
          scoreRate: {
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
          },
        },
        secondHalf: {
          scoreRate: {
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
          },
        },
      } as any;

      const expectedData = {
        odds: [
          {
            h1_hdp_home: 1.97,
            h1_hdp_away: 2.02,
            h1_1x2_home: 1.97,
            h1_1x2_away: 3.49,
            h1_1x2_draw: 4.81,
            h1_ou_over: 2.42,
            h1_ou_under: 1.7,
            h1_oe_odd: 2.11,
            h1_oe_even: 1.9,
            h1_home_over: 2.3,
            h1_home_under: 1.76,
            h1_away_over: 1.52,
            h1_away_under: 2.89,
            ft_hdp_home: 1.69,
            ft_hdp_away: 2.42,
            ft_1x2_home: 1.69,
            ft_1x2_away: 3.88,
            ft_1x2_draw: 6.48,
            ft_ou_over: 1.84,
            ft_ou_under: 2.18,
            ft_oe_odd: 2,
            ft_oe_even: 1.99,
            ft_home_over: 1.74,
            ft_home_under: 2.33,
            ft_away_over: 1.72,
            ft_away_under: 2.37,
          },
          {
            ft_1x2_home: 1.97,
            ft_1x2_away: 3.49,
            ft_1x2_draw: 4.81,
            ft_hdp_home: 1.97,
            ft_hdp_away: 2.02,
            ft_ou_over: 2.42,
            ft_ou_under: 1.7,
            ft_oe_odd: 2.11,
            ft_oe_even: 1.9,
            ft_home_over: 2.3,
            ft_home_under: 1.76,
            ft_away_over: 1.52,
            ft_away_under: 2.89,
          },
        ],
        matchConfig: {
          firstHalf: {
            scoreRate: {
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
            },
            overUnderValue: 2.5,
            handicapValue: -0.5,
            homeOverUnderValue: 1.5,
            awayOverUnderValue: 0.5,
          },
          secondHalf: {
            scoreRate: {
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
            },
            overUnderValue: 2.5,
            handicapValue: -0.5,
            homeOverUnderValue: 1.5,
            awayOverUnderValue: 0.5,
          },
          overUnderValue: 4.5,
          handicapValue: -0.5,
          homeOverUnderValue: 2.5,
          awayOverUnderValue: 1.5,
        },
        selections: [
          {
            h1_hdp_home: {
              name: "h1_hdp_home",
              price: 1.97,
              point: -0.5,
              settlementStatus: "P",
            },
            h1_hdp_away: {
              name: "h1_hdp_away",
              price: 2.02,
              point: 0.5,
              settlementStatus: "P",
            },
            h1_1x2_home: {
              name: "h1_1x2_home",
              price: 1.97,
              point: 0,
              settlementStatus: "P",
            },
            h1_1x2_away: {
              name: "h1_1x2_away",
              price: 3.49,
              point: 0,
              settlementStatus: "P",
            },
            h1_1x2_draw: {
              name: "h1_1x2_draw",
              price: 4.81,
              point: 0,
              settlementStatus: "P",
            },
            h1_ou_over: {
              name: "h1_ou_over",
              price: 2.42,
              point: 2.5,
              settlementStatus: "P",
            },
            h1_ou_under: {
              name: "h1_ou_under",
              price: 1.7,
              point: 2.5,
              settlementStatus: "P",
            },
            h1_oe_odd: {
              name: "h1_oe_odd",
              price: 2.11,
              point: 0,
              settlementStatus: "P",
            },
            h1_oe_even: {
              name: "h1_oe_even",
              price: 1.9,
              point: 0,
              settlementStatus: "P",
            },
            h1_home_over: {
              name: "h1_home_over",
              price: 2.3,
              point: 1.5,
              settlementStatus: "P",
            },
            h1_home_under: {
              name: "h1_home_under",
              price: 1.76,
              point: 1.5,
              settlementStatus: "P",
            },
            h1_away_over: {
              name: "h1_away_over",
              price: 1.52,
              point: 0.5,
              settlementStatus: "P",
            },
            h1_away_under: {
              name: "h1_away_under",
              price: 2.89,
              point: 0.5,
              settlementStatus: "P",
            },
            ft_hdp_home: {
              name: "ft_hdp_home",
              price: 1.69,
              point: -0.5,
              settlementStatus: "P",
            },
            ft_hdp_away: {
              name: "ft_hdp_away",
              price: 2.42,
              point: 0.5,
              settlementStatus: "P",
            },
            ft_1x2_home: {
              name: "ft_1x2_home",
              price: 1.69,
              point: 0,
              settlementStatus: "P",
            },
            ft_1x2_away: {
              name: "ft_1x2_away",
              price: 3.88,
              point: 0,
              settlementStatus: "P",
            },
            ft_1x2_draw: {
              name: "ft_1x2_draw",
              price: 6.48,
              point: 0,
              settlementStatus: "P",
            },
            ft_ou_over: {
              name: "ft_ou_over",
              price: 1.84,
              point: 4.5,
              settlementStatus: "P",
            },
            ft_ou_under: {
              name: "ft_ou_under",
              price: 2.18,
              point: 4.5,
              settlementStatus: "P",
            },
            ft_oe_odd: {
              name: "ft_oe_odd",
              price: 2,
              point: 0,
              settlementStatus: "P",
            },
            ft_oe_even: {
              name: "ft_oe_even",
              price: 1.99,
              point: 0,
              settlementStatus: "P",
            },
            ft_home_over: {
              name: "ft_home_over",
              price: 1.74,
              point: 2.5,
              settlementStatus: "P",
            },
            ft_home_under: {
              name: "ft_home_under",
              price: 2.33,
              point: 2.5,
              settlementStatus: "P",
            },
            ft_away_over: {
              name: "ft_away_over",
              price: 1.72,
              point: 1.5,
              settlementStatus: "P",
            },
            ft_away_under: {
              name: "ft_away_under",
              price: 2.37,
              point: 1.5,
              settlementStatus: "P",
            },
          },
          {
            ft_1x2_home: {
              name: "ft_1x2_home",
              price: 1.97,
              point: 0,
              settlementStatus: "P",
            },
            ft_1x2_away: {
              name: "ft_1x2_away",
              price: 3.49,
              point: 0,
              settlementStatus: "P",
            },
            ft_1x2_draw: {
              name: "ft_1x2_draw",
              price: 4.81,
              point: 0,
              settlementStatus: "P",
            },
            ft_hdp_home: {
              name: "ft_hdp_home",
              price: 1.97,
              point: -0.5,
              settlementStatus: "P",
            },
            ft_hdp_away: {
              name: "ft_hdp_away",
              price: 2.02,
              point: 0.5,
              settlementStatus: "P",
            },
            ft_ou_over: {
              name: "ft_ou_over",
              price: 2.42,
              point: 2.5,
              settlementStatus: "P",
            },
            ft_ou_under: {
              name: "ft_ou_under",
              price: 1.7,
              point: 2.5,
              settlementStatus: "P",
            },
            ft_oe_odd: {
              name: "ft_oe_odd",
              price: 2.11,
              point: 0,
              settlementStatus: "P",
            },
            ft_oe_even: {
              name: "ft_oe_even",
              price: 1.9,
              point: 0,
              settlementStatus: "P",
            },
            ft_home_over: {
              name: "ft_home_over",
              price: 2.3,
              point: 1.5,
              settlementStatus: "P",
            },
            ft_home_under: {
              name: "ft_home_under",
              price: 1.76,
              point: 1.5,
              settlementStatus: "P",
            },
            ft_away_over: {
              name: "ft_away_over",
              price: 1.52,
              point: 0.5,
              settlementStatus: "P",
            },
            ft_away_under: {
              name: "ft_away_under",
              price: 2.89,
              point: 0.5,
              settlementStatus: "P",
            },
          },
        ],
      };

      const firstHalfScore = "0";

      const result = oddsGeneratorService.calculateOddsForRound(matchConfig, firstHalfScore);

      expect(result).toEqual(expectedData);
    });
  });
});
