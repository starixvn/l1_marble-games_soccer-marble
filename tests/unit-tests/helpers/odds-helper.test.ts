import {
  calculateOddsForRound,
  parseScore,
  roundToPrecision,
  calculateFullTimeScoreRates,
  calculateProbabilitiesForBetChoices,
  calculateHandicapValue,
  calculateOverUnderValue,
  calculateBetOdds,
  probabilityToBetRawOdds,
  calculateFulltimeOdds,
  calculateHalfOdds,
} from "../../../src/helpers/odds-helper";

describe("OddsHelper Tests", () => {
  describe("parseScore", () => {
    it("should parse a simple score string into an array of numbers", () => {
      expect(parseScore("1-0")).toEqual([1, 0]);
      expect(parseScore("0-1")).toEqual([0, 1]);
      expect(parseScore("2-2")).toEqual([2, 2]);
    });

    it("should handle high-scoring matches", () => {
      expect(parseScore("5-3")).toEqual([5, 3]);
      expect(parseScore("7-0")).toEqual([7, 0]);
      expect(parseScore("0-8")).toEqual([0, 8]);
    });

    it("should handle single-digit scores", () => {
      expect(parseScore("0-0")).toEqual([0, 0]);
      expect(parseScore("1-1")).toEqual([1, 1]);
      expect(parseScore("9-9")).toEqual([9, 9]);
    });
  });

  describe("roundToPrecision", () => {
    it("should round to 2 decimal places with default precision", () => {
      expect(roundToPrecision(1.256)).toBe(1.25);
      expect(roundToPrecision(2.99)).toBe(2.99);
      expect(roundToPrecision(3.505)).toBe(3.5);
    });

    it("should round using custom precision values", () => {
      expect(roundToPrecision(1.256, 10)).toBe(1.2);
      expect(roundToPrecision(2.998, 1000)).toBe(2.998);
      expect(roundToPrecision(3.505, 1)).toBe(3);
    });

    it("should handle edge cases", () => {
      expect(roundToPrecision(0)).toBe(0);
      expect(roundToPrecision(-1.235)).toBe(-1.24);
      expect(roundToPrecision(1000000.125)).toBe(1000000.12);
    });
  });

  describe("calculateOddsForRound", () => {
    it("should calculate odds for round", () => {
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

      const expected = {
        matchConfig: {
          firstHalf: {
            scoreRate: {
              "0-1": 0.0824,
              "0-2": 0.0353,
              "0-3": 0.0118,
              "0-4": 0.0118,
              "1-0": 0.1176,
              "1-1": 0.1293,
              "1-2": 0.0824,
              "1-3": 0.0353,
              "2-0": 0.1176,
              "2-1": 0.1294,
              "2-2": 0.0706,
              "3-0": 0.0706,
              "3-1": 0.0824,
              "4-0": 0.0235,
            },
            handicapValue: -0.5,
            overUnderValue: 2.5,
          },
          handicapValue: -1.5,
          overUnderValue: 5.5,
          secondHalf: {
            scoreRate: {
              "0-1": 0.0824,
              "0-2": 0.0353,
              "0-3": 0.0118,
              "0-4": 0.0118,
              "1-0": 0.1176,
              "1-1": 0.1293,
              "1-2": 0.0824,
              "1-3": 0.0353,
              "2-0": 0.1176,
              "2-1": 0.1294,
              "2-2": 0.0706,
              "3-0": 0.0706,
              "3-1": 0.0824,
              "4-0": 0.0235,
            },
            handicapValue: -0.5,
            overUnderValue: 2.5,
          },
        },
        odds: [
          {
            ft_1x2_away: 4.38,
            ft_1x2_draw: 6.58,
            ft_1x2_home: 1.61,
            ft_hdp_away: 1.8,
            ft_hdp_home: 2.24,
            ft_oe_even: 1.99,
            ft_oe_odd: 2,
            ft_ou_over: 2.53,
            ft_ou_under: 1.65,
            h1_1x2_away: 3.86,
            h1_1x2_draw: 5,
            h1_1x2_home: 1.84,
            h1_hdp_away: 2.17,
            h1_hdp_home: 1.84,
            h1_oe_even: 1.97,
            h1_oe_odd: 2.02,
            h1_ou_over: 1.93,
            h1_ou_under: 2.07,
          },
          {
            ft_hdp_away: 2.17,
            ft_hdp_home: 1.84,
            ft_oe_even: 1.97,
            ft_oe_odd: 2.02,
            ft_ou_over: 1.93,
            ft_ou_under: 2.07,
          },
        ],
        selections: [
          {
            ft_1x2_away: {
              name: "ft_1x2_away",
              point: 0,
              price: 4.38,
              settlementStatus: "P",
            },
            ft_1x2_draw: {
              name: "ft_1x2_draw",
              point: 0,
              price: 6.58,
              settlementStatus: "P",
            },
            ft_1x2_home: {
              name: "ft_1x2_home",
              point: 0,
              price: 1.61,
              settlementStatus: "P",
            },
            ft_hdp_away: {
              name: "ft_hdp_away",
              point: 1.5,
              price: 1.8,
              settlementStatus: "P",
            },
            ft_hdp_home: {
              name: "ft_hdp_home",
              point: -1.5,
              price: 2.24,
              settlementStatus: "P",
            },
            ft_oe_even: {
              name: "ft_oe_even",
              point: 0,
              price: 1.99,
              settlementStatus: "P",
            },
            ft_oe_odd: {
              name: "ft_oe_odd",
              point: 0,
              price: 2,
              settlementStatus: "P",
            },
            ft_ou_over: {
              name: "ft_ou_over",
              point: 5.5,
              price: 2.53,
              settlementStatus: "P",
            },
            ft_ou_under: {
              name: "ft_ou_under",
              point: 5.5,
              price: 1.65,
              settlementStatus: "P",
            },
            h1_1x2_away: {
              name: "h1_1x2_away",
              point: 0,
              price: 3.86,
              settlementStatus: "P",
            },
            h1_1x2_draw: {
              name: "h1_1x2_draw",
              point: 0,
              price: 5,
              settlementStatus: "P",
            },
            h1_1x2_home: {
              name: "h1_1x2_home",
              point: 0,
              price: 1.84,
              settlementStatus: "P",
            },
            h1_hdp_away: {
              name: "h1_hdp_away",
              point: 0.5,
              price: 2.17,
              settlementStatus: "P",
            },
            h1_hdp_home: {
              name: "h1_hdp_home",
              point: -0.5,
              price: 1.84,
              settlementStatus: "P",
            },
            h1_oe_even: {
              name: "h1_oe_even",
              point: 0,
              price: 1.97,
              settlementStatus: "P",
            },
            h1_oe_odd: {
              name: "h1_oe_odd",
              point: 0,
              price: 2.02,
              settlementStatus: "P",
            },
            h1_ou_over: {
              name: "h1_ou_over",
              point: 2.5,
              price: 1.93,
              settlementStatus: "P",
            },
            h1_ou_under: {
              name: "h1_ou_under",
              point: 2.5,
              price: 2.07,
              settlementStatus: "P",
            },
          },
          {
            ft_hdp_away: {
              name: "ft_hdp_away",
              point: 2.5,
              price: 2.17,
              settlementStatus: "P",
            },
            ft_hdp_home: {
              name: "ft_hdp_home",
              point: -2.5,
              price: 1.84,
              settlementStatus: "P",
            },
            ft_oe_even: {
              name: "ft_oe_even",
              point: 0,
              price: 1.97,
              settlementStatus: "P",
            },
            ft_oe_odd: {
              name: "ft_oe_odd",
              point: 0,
              price: 2.02,
              settlementStatus: "P",
            },
            ft_ou_over: {
              name: "ft_ou_over",
              point: 4.5,
              price: 1.93,
              settlementStatus: "P",
            },
            ft_ou_under: {
              name: "ft_ou_under",
              point: 4.5,
              price: 2.07,
              settlementStatus: "P",
            },
          },
        ],
      };

      const actual = calculateOddsForRound(matchConfig, firstHalfScore);

      expect(actual).toEqual(expected);
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

      const result = calculateFullTimeScoreRates(firstHalf, secondHalf);

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

      const result = calculateProbabilitiesForBetChoices(scoreRates);

      expect(result.probabilities).toEqual({
        hdp_home: expect.any(Number),
        hdp_away: expect.any(Number),
        hdp_draw: expect.any(Number),
        home: 0.4,
        away: 0.3,
        draw: 0.3,
        over: expect.any(Number),
        under: expect.any(Number),
        even: expect.any(Number),
        odd: expect.any(Number),
      });
      expect(result.overUnderValue).toBeDefined();
      expect(result.handicapValue).toBeDefined();
    });
  });

  describe("calculateHandicapValue", () => {
    it("should calculate handicap value based on home and away scores", () => {
      expect(calculateHandicapValue(2, 1)).toBe(-0.5);
      expect(calculateHandicapValue(1, 2)).toBe(1.5);
      expect(calculateHandicapValue(1, 1)).toBe(0.5);
      expect(calculateHandicapValue(1.2, 2)).toBe(0.5);
      expect(calculateHandicapValue(2, 1.2)).toBe(-0.5);
    });
  });

  describe("calculateOverUnderValue", () => {
    it("should calculate over/under value based on home and away scores", () => {
      expect(calculateOverUnderValue(2, 1)).toBe(3.5);
      expect(calculateOverUnderValue(1, 2)).toBe(3.5);
      expect(calculateOverUnderValue(1, 1)).toBe(2.5);
      expect(calculateOverUnderValue(1.2, 2.2)).toBe(3.5);
    });
  });

  describe("calculateBetOdds", () => {
    it("should calculate bet odds from probabilities", () => {
      const probabilities = {
        home: 0.5,
        away: 0.3,
        draw: 0.2,
      };

      const result = calculateBetOdds(probabilities);

      expect(result).toEqual({
        home: expect.any(Number),
        away: expect.any(Number),
        draw: expect.any(Number),
      });
    });
  });

  describe("probabilityToBetRawOdds", () => {
    it("should convert probability to bet odds", () => {
      expect(probabilityToBetRawOdds(0.5)).toBe(2);
      expect(probabilityToBetRawOdds(0.25)).toBe(4);
      expect(probabilityToBetRawOdds(0.1)).toBe(10);
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

      const result = calculateFulltimeOdds(matchConfig);

      expect(result).toEqual({
        odds: expect.any(Object),
        overUnderValue: expect.any(Number),
        handicapValue: expect.any(Number),
      });
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

      const result = calculateHalfOdds(halfConfig);

      expect(result).toEqual({
        odds: expect.any(Object),
        overUnderValue: expect.any(Number),
        handicapValue: expect.any(Number),
      });
    });
  });
});
