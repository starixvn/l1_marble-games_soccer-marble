import { oddsHelper } from "../../../src/helpers";

describe("OddsHelper Tests", () => {
  describe("parseScore", () => {
    it("should parse a simple score string into an array of numbers", () => {
      expect(oddsHelper.parseScore("1-0")).toEqual([1, 0]);
      expect(oddsHelper.parseScore("0-1")).toEqual([0, 1]);
      expect(oddsHelper.parseScore("2-2")).toEqual([2, 2]);
    });

    it("should handle high-scoring matches", () => {
      expect(oddsHelper.parseScore("5-3")).toEqual([5, 3]);
      expect(oddsHelper.parseScore("7-0")).toEqual([7, 0]);
      expect(oddsHelper.parseScore("0-8")).toEqual([0, 8]);
    });

    it("should handle single-digit scores", () => {
      expect(oddsHelper.parseScore("0-0")).toEqual([0, 0]);
      expect(oddsHelper.parseScore("1-1")).toEqual([1, 1]);
      expect(oddsHelper.parseScore("9-9")).toEqual([9, 9]);
    });

    it("should handle double-digit scores", () => {
      expect(oddsHelper.parseScore("10-5")).toEqual([10, 5]);
      expect(oddsHelper.parseScore("15-12")).toEqual([15, 12]);
    });

    it("should handle different separators ( comma, dash)", () => {
      expect(oddsHelper.parseScore("1:0")).toEqual([1, 0]);
      expect(oddsHelper.parseScore("2-2")).toEqual([2, 2]);
    });
  });

  describe("floorToPrecision", () => {
    it("should floor to 2 decimal places with default precision", () => {
      expect(oddsHelper.floorToPrecision(1.256)).toBe(1.25);
      expect(oddsHelper.floorToPrecision(2.99)).toBe(2.99);
      expect(oddsHelper.floorToPrecision(3.505)).toBe(3.5);
    });

    it("should floor using custom precision values", () => {
      expect(oddsHelper.floorToPrecision(1.256, 10)).toBe(1.2);
      expect(oddsHelper.floorToPrecision(2.998, 1000)).toBe(2.998);
      expect(oddsHelper.floorToPrecision(3.505, 1)).toBe(3);
    });

    it("should handle edge cases", () => {
      expect(oddsHelper.floorToPrecision(0)).toBe(0);
      expect(oddsHelper.floorToPrecision(-1.235)).toBe(-1.24);
      expect(oddsHelper.floorToPrecision(1000000.125)).toBe(1000000.12);
    });

    it("should handle very small numbers", () => {
      expect(oddsHelper.floorToPrecision(0.001, 1000)).toBe(0.001);
      expect(oddsHelper.floorToPrecision(0.0001, 10000)).toBe(0.0001);
    });
  });

  describe("roundToPrecision", () => {
    it("should round to 2 decimal places with default precision", () => {
      expect(oddsHelper.roundToPrecision(1.256)).toBe(1.26);
      expect(oddsHelper.roundToPrecision(2.994)).toBe(2.99);
      expect(oddsHelper.roundToPrecision(3.505)).toBe(3.51);
    });

    it("should round using custom precision values", () => {
      expect(oddsHelper.roundToPrecision(1.256, 10)).toBe(1.3);
      expect(oddsHelper.roundToPrecision(2.998, 1000)).toBe(2.998);
      expect(oddsHelper.roundToPrecision(3.505, 1)).toBe(4);
    });

    it("should handle edge cases", () => {
      expect(oddsHelper.roundToPrecision(0)).toBe(0);
      expect(oddsHelper.roundToPrecision(-1.235)).toBe(-1.24);
      expect(oddsHelper.roundToPrecision(1000000.125)).toBe(1000000.13);
    });

    it("should handle very small numbers", () => {
      expect(oddsHelper.roundToPrecision(0.0015, 1000)).toBe(0.002);
      expect(oddsHelper.roundToPrecision(0.00015, 10000)).toBe(0.0001);
    });
  });

  describe("mergeTwoScoreRates", () => {
    it("should merge score rates from 2 rates", () => {
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

      const result = oddsHelper.mergeTwoScoreRates(firstHalf, secondHalf);

      expect(result).toEqual({
        scoreRate: {
          "2-0": 0.25,
          "1-1": 0.5, // Combined probability for both 1-1 scenarios
          "0-2": 0.25,
        },
      });
    });
  });

  describe("mergeArrayOfRates", () => {
    it("should merge multiple score rates from an array", () => {
      const rates = [
        {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
        {
          scoreRate: {
            "1-0": 0.5,
            "0-1": 0.5,
          },
        },
      ];

      const result = oddsHelper.mergeArrayOfRates(rates);

      expect(result).toEqual({
        scoreRate: {
          "3-0": 0.125,
          "2-1": 0.375,
          "1-2": 0.375,
          "0-3": 0.125,
        },
      });
    });

    it("should handle single rate in array", () => {
      const rates = [
        {
          scoreRate: {
            "2-1": 1.0,
          },
        },
      ];

      const result = oddsHelper.mergeArrayOfRates(rates);

      expect(result).toEqual({
        scoreRate: {
          "2-1": 1.0,
        },
      });
    });

    it("should handle empty array", () => {
      const rates: any[] = [];

      const result = oddsHelper.mergeArrayOfRates(rates);
      expect(result).toBeUndefined();
    });
  });

  describe("probabilityToBetRawOdds", () => {
    it("should convert probability to bet odds", () => {
      expect(oddsHelper.probabilityToBetRawOdds(0.5)).toBe(2);
      expect(oddsHelper.probabilityToBetRawOdds(0.25)).toBe(4);
      expect(oddsHelper.probabilityToBetRawOdds(0.1)).toBe(10);
    });

    it("should handle edge cases", () => {
      expect(oddsHelper.probabilityToBetRawOdds(0)).toBe(0);
      expect(oddsHelper.probabilityToBetRawOdds(1)).toBe(0);
      expect(oddsHelper.probabilityToBetRawOdds(0.01)).toBe(100);
      expect(oddsHelper.probabilityToBetRawOdds(0.99)).toBe(1.01);
    });

    it("should handle invalid probabilities", () => {
      expect(oddsHelper.probabilityToBetRawOdds(-0.1)).toBe(0);
      expect(oddsHelper.probabilityToBetRawOdds(1.1)).toBe(0);
    });
  });

  describe("calculateAverageScore", () => {
    it("should calculate average scores from score rates", () => {
      const scoreRates = {
        "1-0": 0.4,
        "0-1": 0.3,
        "1-1": 0.3,
      };

      const result = oddsHelper.calculateAverageScore(scoreRates);

      expect(result.homeScore).toBeCloseTo(0.7, 4);
      expect(result.awayScore).toBeCloseTo(0.6, 4);
    });

    it("should handle single score rate", () => {
      const scoreRates = {
        "2-1": 1.0,
      };

      const result = oddsHelper.calculateAverageScore(scoreRates);

      expect(result.homeScore).toBe(2);
      expect(result.awayScore).toBe(1);
    });

    it("should handle zero scores", () => {
      const scoreRates = {
        "0-0": 1.0,
      };

      const result = oddsHelper.calculateAverageScore(scoreRates);

      expect(result.homeScore).toBe(0);
      expect(result.awayScore).toBe(0);
    });

    it("should handle high scoring rates", () => {
      const scoreRates = {
        "5-3": 0.5,
        "3-5": 0.5,
      };

      const result = oddsHelper.calculateAverageScore(scoreRates);

      expect(result.homeScore).toBe(4);
      expect(result.awayScore).toBe(4);
    });
  });
});
