import {
  generateResult,
  generateVideoName,
  getScoreFromScoreRate,
  getSettlementResult,
} from "../../../src/helpers/result-helper";
import crypto from "crypto";
import { SettlementStatus } from "../../../src/types";

const NUMBER_OF_VIDEOS = {
  HAA: 1,
  AHH: 2,
  A: 1,
  H: 1,
};

describe("result helper tests", () => {
  describe("getScoreFromScoreRate", () => {
    it("should return one of the valid scores", () => {
      // Arrange
      const scoreRate = {
        "1-0": 0.1285,
        "0-1": 0.1285,
        "1-1": 0.18,
        "2-0": 0.0834,
        "0-2": 0.0834,
        "2-1": 0.0729,
        "1-2": 0.0729,
        "3-0": 0.0416,
        "0-3": 0.0416,
        "2-2": 0.0628,
        "3-1": 0.0418,
        "1-3": 0.0418,
        "4-0": 0.0104,
        "0-4": 0.0104,
      };

      // Act
      const result = getScoreFromScoreRate(scoreRate);

      // Assert
      expect(Object.keys(scoreRate)).toContain(result);
    });
  });

  describe("generateVideoName", () => {
    it("should return a valid video name", () => {
      // Arrange
      const result = "HAA";

      const videoName = generateVideoName(result, NUMBER_OF_VIDEOS);
      const expectedVideoname = crypto.createHash("sha256").update(`${result}-0`).digest("hex");

      // Assert
      expect(videoName).toBe(expectedVideoname);
    });
  });

  describe("generateResult", () => {
    it("should return a valid result based on match config", () => {
      // Arrange
      const matchConfig = {
        firstHalf: {
          scoreRate: {
            "1-0": 1,
          },
        },
        secondHalf: {
          scoreRate: {
            "0-1": 1,
          },
        },
      };

      const firstHalfVideo = crypto.createHash("sha256").update(`H-0`).digest("hex");
      const secondHalfVideo = crypto.createHash("sha256").update(`A-0`).digest("hex");

      const expectedFirstHalfResult = {
        playlist: firstHalfVideo,
        goalInfo: firstHalfVideo,
        result: { goalSequence: "H", finalScore: "1:0" },
      };

      const expectedSecondHalfResult = {
        playlist: secondHalfVideo,
        goalInfo: secondHalfVideo,
        result: { goalSequence: "A", finalScore: "0:1" },
      };

      // Act
      const result = generateResult({
        numberOfVideos: NUMBER_OF_VIDEOS,
        matchConfig: matchConfig as any,
      });

      // Assert
      const [firstHalf, secondHalf] = result.drawResults;

      expect(firstHalf).toEqual(expectedFirstHalfResult);
      expect(secondHalf).toEqual(expectedSecondHalfResult);
    });
  });

  describe("getSettlementResult", () => {
    const matchConfig = {
      firstHalf: {
        overUnderValue: 1.5,
        handicapValue: -0.5,
        scoreRate: { "1-0": 1 },
        homeOverUnderValue: 0.5,
        awayOverUnderValue: 0.5,
      },
      secondHalf: {
        overUnderValue: 1.5,
        handicapValue: 0,
        scoreRate: { "0-1": 1 },
        homeOverUnderValue: 0.5,
        awayOverUnderValue: 0.5,
      },
      overUnderValue: 2.5,
      handicapValue: -0.5,
      homeOverUnderValue: 1.5,
      awayOverUnderValue: 1.5,
    };
    describe("with round result [2:0, 0:1]", () => {
      it("should correctly settle all bets", () => {
        // Arrange
        const roundResult = {
          drawResults: [
            {
              playlist: "test-video-1",
              goalInfo: "test-video-1",
              result: { goalSequence: "HH", finalScore: "2:0" },
            },
            {
              playlist: "test-video-2",
              goalInfo: "test-video-2",
              result: { goalSequence: "A", finalScore: "0:1" },
            },
          ],
        };

        // Act
        const result = getSettlementResult(roundResult, matchConfig);

        // Assert - Test all first half settlement values for this result
        expect(result[0].h1_hdp_home).toBe(SettlementStatus.WIN);
        expect(result[0].h1_hdp_away).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_1x2_home).toBe(SettlementStatus.WIN);
        expect(result[0].h1_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_ou_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_ou_under).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_oe_even).toBe(SettlementStatus.WIN);
        expect(result[0].h1_oe_odd).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_home_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_home_under).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_away_over).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_away_under).toBe(SettlementStatus.WIN);

        // Assert - Test all full time (at first half) settlement values for this result
        expect(result[0].ft_hdp_home).toBe(SettlementStatus.WIN);
        expect(result[0].ft_hdp_away).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_home).toBe(SettlementStatus.WIN);
        expect(result[0].ft_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_ou_over).toBe(SettlementStatus.WIN);
        expect(result[0].ft_ou_under).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_oe_odd).toBe(SettlementStatus.WIN);
        expect(result[0].ft_oe_even).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_home_over).toBe(SettlementStatus.WIN);
        expect(result[0].ft_home_under).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_away_over).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_away_under).toBe(SettlementStatus.WIN);

        // Assert - Test all full time (at second half) settlement values for this result
        expect(result[1].ft_hdp_home).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_hdp_away).toBe(SettlementStatus.WIN);
        expect(result[1].ft_1x2_home).toBe(SettlementStatus.WIN);
        expect(result[1].ft_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_under).toBe(SettlementStatus.WIN);
        expect(result[1].ft_oe_odd).toBe(SettlementStatus.WIN);
        expect(result[1].ft_oe_even).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_home_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_home_under).toBe(SettlementStatus.WIN);
        expect(result[1].ft_away_over).toBe(SettlementStatus.WIN);
        expect(result[1].ft_away_under).toBe(SettlementStatus.LOSE);
      });
    });

    describe("with round result [0:1, 1:0]", () => {
      it("should correctly settle all bets", () => {
        // Arrange
        const roundResult = {
          drawResults: [
            {
              playlist: "test-video-2",
              goalInfo: "test-video-2",
              result: { goalSequence: "A", finalScore: "0:1" },
            },
            {
              playlist: "test-video-1",
              goalInfo: "test-video-1",
              result: { goalSequence: "H", finalScore: "1:0" },
            },
          ],
        };

        const newMatchConfig = {
          ...matchConfig,
          handicapValue: 0,
        };

        // Act
        const result = getSettlementResult(roundResult, newMatchConfig);

        // Assert - Test all first half settlement values for this result
        expect(result[0].h1_hdp_home).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_hdp_away).toBe(SettlementStatus.WIN);
        expect(result[0].h1_1x2_home).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_1x2_away).toBe(SettlementStatus.WIN);
        expect(result[0].h1_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_ou_under).toBe(SettlementStatus.WIN);
        expect(result[0].h1_oe_odd).toBe(SettlementStatus.WIN);
        expect(result[0].h1_oe_even).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_home_over).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_home_under).toBe(SettlementStatus.WIN);
        expect(result[0].h1_away_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_away_under).toBe(SettlementStatus.LOSE);

        // Assert - Test all full time settlement values in first half result
        expect(result[0].ft_hdp_home).toBe(SettlementStatus.DRAW);
        expect(result[0].ft_hdp_away).toBe(SettlementStatus.DRAW);
        expect(result[0].ft_1x2_home).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_draw).toBe(SettlementStatus.WIN);
        expect(result[0].ft_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_ou_under).toBe(SettlementStatus.WIN);
        expect(result[0].ft_oe_odd).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_oe_even).toBe(SettlementStatus.WIN);
        expect(result[0].ft_home_over).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_home_under).toBe(SettlementStatus.WIN);
        expect(result[0].ft_away_over).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_away_under).toBe(SettlementStatus.WIN);

        // Assert - Test all full time settlement values in second half result
        expect(result[1].ft_1x2_home).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_1x2_draw).toBe(SettlementStatus.WIN);
        expect(result[1].ft_hdp_home).toBe(SettlementStatus.WIN);
        expect(result[1].ft_hdp_away).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_under).toBe(SettlementStatus.WIN);
        expect(result[1].ft_oe_odd).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_oe_even).toBe(SettlementStatus.WIN);
        expect(result[1].ft_home_over).toBe(SettlementStatus.WIN);
        expect(result[1].ft_home_under).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_away_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_away_under).toBe(SettlementStatus.WIN);
      });
    });

    describe("with round result [0:1, 0:1]", () => {
      it("should correctly settle all bets", () => {
        // Arrange
        const roundResult = {
          drawResults: [
            {
              playlist: "test-video-1",
              goalInfo: "test-video-1",
              result: { goalSequence: "A", finalScore: "0:1" },
            },
            {
              playlist: "test-video-2",
              goalInfo: "test-video-2",
              result: { goalSequence: "A", finalScore: "0:1" },
            },
          ],
        };

        const newMatchConfig = {
          ...matchConfig,
          firstHalf: {
            ...matchConfig.firstHalf,
            handicapValue: 1,
          },
        };

        // Act
        const result = getSettlementResult(roundResult, newMatchConfig);

        // Assert - Test all first half settlement values for this result
        expect(result[0].h1_hdp_home).toBe(SettlementStatus.DRAW);
        expect(result[0].h1_hdp_away).toBe(SettlementStatus.DRAW);
        expect(result[0].h1_1x2_home).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_1x2_away).toBe(SettlementStatus.WIN);
        expect(result[0].h1_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_ou_under).toBe(SettlementStatus.WIN);
        expect(result[0].h1_oe_odd).toBe(SettlementStatus.WIN);
        expect(result[0].h1_oe_even).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_home_over).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_home_under).toBe(SettlementStatus.WIN);
        expect(result[0].h1_away_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_away_under).toBe(SettlementStatus.LOSE);

        // Assert - Test all full time settlement values in first half result
        expect(result[0].ft_hdp_home).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_hdp_away).toBe(SettlementStatus.WIN);
        expect(result[0].ft_1x2_home).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_away).toBe(SettlementStatus.WIN);
        expect(result[0].ft_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_ou_under).toBe(SettlementStatus.WIN);
        expect(result[0].ft_oe_even).toBe(SettlementStatus.WIN);
        expect(result[0].ft_oe_odd).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_home_over).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_home_under).toBe(SettlementStatus.WIN);
        expect(result[0].ft_away_over).toBe(SettlementStatus.WIN);
        expect(result[0].ft_away_under).toBe(SettlementStatus.LOSE);

        // Assert - Test all full time settlement values in second half result
        expect(result[1].ft_1x2_home).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_1x2_away).toBe(SettlementStatus.WIN);
        expect(result[1].ft_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_hdp_home).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_hdp_away).toBe(SettlementStatus.WIN);
        expect(result[1].ft_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_under).toBe(SettlementStatus.WIN);
        expect(result[1].ft_oe_odd).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_oe_even).toBe(SettlementStatus.WIN);
        expect(result[1].ft_home_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_home_under).toBe(SettlementStatus.WIN);
        expect(result[1].ft_away_over).toBe(SettlementStatus.WIN);
        expect(result[1].ft_away_under).toBe(SettlementStatus.LOSE);
      });
    });

    describe("with round result [1:1, 1:0]", () => {
      it("should correctly settle all bets for draw", () => {
        // Arrange
        const roundResult = {
          drawResults: [
            {
              playlist: "test-video-1",
              goalInfo: "test-video-1",
              result: { goalSequence: "HA", finalScore: "1:1" },
            },
            {
              playlist: "test-video-2",
              goalInfo: "test-video-2",
              result: { goalSequence: "H", finalScore: "1:0" },
            },
          ],
        };

        const newMatchConfig = {
          ...matchConfig,
          firstHalf: {
            ...matchConfig.firstHalf,
            handicapValue: 0,
          },
          handicapValue: 0,
        };

        // Act
        const result = getSettlementResult(roundResult, newMatchConfig);

        // Assert - Test all first half settlement values for this result
        expect(result[0].h1_hdp_home).toBe(SettlementStatus.DRAW);
        expect(result[0].h1_hdp_away).toBe(SettlementStatus.DRAW);
        expect(result[0].h1_1x2_home).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_1x2_draw).toBe(SettlementStatus.WIN);
        expect(result[0].h1_ou_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_ou_under).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_oe_even).toBe(SettlementStatus.WIN);
        expect(result[0].h1_oe_odd).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_home_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_home_under).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_away_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_away_under).toBe(SettlementStatus.LOSE);

        // Assert - Test all full time settlement values in first half result
        expect(result[0].ft_hdp_home).toBe(SettlementStatus.WIN);
        expect(result[0].ft_hdp_away).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_home).toBe(SettlementStatus.WIN);
        expect(result[0].ft_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_ou_over).toBe(SettlementStatus.WIN);
        expect(result[0].ft_ou_under).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_oe_odd).toBe(SettlementStatus.WIN);
        expect(result[0].ft_oe_even).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_home_over).toBe(SettlementStatus.WIN);
        expect(result[0].ft_home_under).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_away_over).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_away_under).toBe(SettlementStatus.WIN);

        // Assert - Test all full time settlement values in second half result
        expect(result[1].ft_1x2_home).toBe(SettlementStatus.WIN);
        expect(result[1].ft_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_hdp_home).toBe(SettlementStatus.WIN);
        expect(result[1].ft_hdp_away).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_under).toBe(SettlementStatus.WIN);
        expect(result[1].ft_oe_odd).toBe(SettlementStatus.WIN);
        expect(result[1].ft_oe_even).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_home_over).toBe(SettlementStatus.WIN);
        expect(result[1].ft_home_under).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_away_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_away_under).toBe(SettlementStatus.WIN);
      });
    });

    describe("with round result [3:1, 1:0]", () => {
      it("should correctly settle all bets", () => {
        // Arrange
        const roundResult = {
          drawResults: [
            {
              playlist: "test-video-1",
              goalInfo: "test-video-1",
              result: { goalSequence: "HHAH", finalScore: "3:1" },
            },
            {
              playlist: "test-video-2",
              goalInfo: "test-video-2",
              result: { goalSequence: "H", finalScore: "1:0" },
            },
          ],
        };

        const newMatchConfig = {
          ...matchConfig,
          firstHalf: {
            ...matchConfig.firstHalf,
            overUnderValue: 2.5,
            handicapValue: 0,
          },
          overUnderValue: 3.5,
          handicapValue: 0,
        };

        // Act
        const result = getSettlementResult(roundResult, newMatchConfig);

        // Assert - Test all first half settlement values for this result
        expect(result[0].h1_hdp_home).toBe(SettlementStatus.WIN);
        expect(result[0].h1_hdp_away).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_1x2_home).toBe(SettlementStatus.WIN);
        expect(result[0].h1_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_ou_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_ou_under).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_oe_odd).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_oe_even).toBe(SettlementStatus.WIN);
        expect(result[0].h1_home_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_home_under).toBe(SettlementStatus.LOSE);
        expect(result[0].h1_away_over).toBe(SettlementStatus.WIN);
        expect(result[0].h1_away_under).toBe(SettlementStatus.LOSE);

        // Assert - Test all full time settlement values in first half result
        expect(result[0].ft_hdp_home).toBe(SettlementStatus.WIN);
        expect(result[0].ft_hdp_away).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_home).toBe(SettlementStatus.WIN);
        expect(result[0].ft_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_ou_over).toBe(SettlementStatus.WIN);
        expect(result[0].ft_ou_under).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_oe_odd).toBe(SettlementStatus.WIN);
        expect(result[0].ft_oe_even).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_home_over).toBe(SettlementStatus.WIN);
        expect(result[0].ft_home_under).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_away_over).toBe(SettlementStatus.LOSE);
        expect(result[0].ft_away_under).toBe(SettlementStatus.WIN);

        // Assert - Test all full time settlement values in second half result
        expect(result[1].ft_1x2_home).toBe(SettlementStatus.WIN);
        expect(result[1].ft_1x2_away).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_1x2_draw).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_hdp_home).toBe(SettlementStatus.WIN);
        expect(result[1].ft_hdp_away).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_ou_under).toBe(SettlementStatus.WIN);
        expect(result[1].ft_oe_odd).toBe(SettlementStatus.WIN);
        expect(result[1].ft_oe_even).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_home_over).toBe(SettlementStatus.WIN);
        expect(result[1].ft_home_under).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_away_over).toBe(SettlementStatus.LOSE);
        expect(result[1].ft_away_under).toBe(SettlementStatus.WIN);
      });
    });
  });
});
