import { ResultGeneratorService } from "../../../src/services/result-generator-service";
import crypto from "crypto";
import { SettlementStatus } from "../../../src/types";
import { mockContainer } from "../global-stubs";

const NUMBER_OF_VIDEOS = {
  HAA: 1,
  AHH: 2,
  A: 1,
  H: 1,
};

describe("ResultGeneratorService tests", () => {
  const resultGeneratorService = new ResultGeneratorService(mockContainer);

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
      const result = resultGeneratorService.getScoreFromScoreRate(scoreRate);

      // Assert
      expect(Object.keys(scoreRate)).toContain(result);
    });
  });

  describe("generateVideoName", () => {
    it("should return a valid video name", () => {
      // Arrange
      const result = "HAA";

      const videoName = resultGeneratorService.generateVideoName(result, NUMBER_OF_VIDEOS);
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
      const result = resultGeneratorService.generateResult({
        numberOfVideos: NUMBER_OF_VIDEOS,
        matchConfig: matchConfig as any,
      });

      // Assert
      const [firstHalf, secondHalf] = result.drawResults;

      expect(firstHalf).toEqual(expectedFirstHalfResult);
      expect(secondHalf).toEqual(expectedSecondHalfResult);
    });
  });

  describe("getHandicapResult", () => {
    it("should return home win for handicap", () => {
      const result = resultGeneratorService.getHandicapResult(2, 1, -0.5);

      expect(result.hdpHome).toBe(SettlementStatus.WIN);
      expect(result.hdpAway).toBe(SettlementStatus.LOSE);
    });

    it("should return away win for handicap", () => {
      const result = resultGeneratorService.getHandicapResult(1, 2, 0.5);

      expect(result.hdpHome).toBe(SettlementStatus.LOSE);
      expect(result.hdpAway).toBe(SettlementStatus.WIN);
    });

    it("should return draw for handicap", () => {
      const result = resultGeneratorService.getHandicapResult(1, 1, 0);

      expect(result.hdpHome).toBe(SettlementStatus.DRAW);
      expect(result.hdpAway).toBe(SettlementStatus.DRAW);
    });
  });

  describe("get1X2Result", () => {
    it("should return home win", () => {
      const result = resultGeneratorService.get1X2Result(2, 1);

      expect(result.home).toBe(SettlementStatus.WIN);
      expect(result.away).toBe(SettlementStatus.LOSE);
      expect(result.draw).toBe(SettlementStatus.LOSE);
    });

    it("should return away win", () => {
      const result = resultGeneratorService.get1X2Result(1, 2);

      expect(result.home).toBe(SettlementStatus.LOSE);
      expect(result.away).toBe(SettlementStatus.WIN);
      expect(result.draw).toBe(SettlementStatus.LOSE);
    });

    it("should return draw", () => {
      const result = resultGeneratorService.get1X2Result(1, 1);

      expect(result.home).toBe(SettlementStatus.LOSE);
      expect(result.away).toBe(SettlementStatus.LOSE);
      expect(result.draw).toBe(SettlementStatus.WIN);
    });
  });

  describe("getOverUnderResult", () => {
    it("should return over win", () => {
      const result = resultGeneratorService.getOverUnderResult(3, 2.5);

      expect(result.over).toBe(SettlementStatus.WIN);
      expect(result.under).toBe(SettlementStatus.LOSE);
    });

    it("should return under win", () => {
      const result = resultGeneratorService.getOverUnderResult(2, 2.5);

      expect(result.over).toBe(SettlementStatus.LOSE);
      expect(result.under).toBe(SettlementStatus.WIN);
    });

    it("should return draw for exact match", () => {
      const result = resultGeneratorService.getOverUnderResult(2, 2);

      expect(result.over).toBe(SettlementStatus.DRAW);
      expect(result.under).toBe(SettlementStatus.DRAW);
    });
  });

  describe("getOddEvenResult", () => {
    it("should return odd win", () => {
      const result = resultGeneratorService.getOddEvenResult(3);

      expect(result.odd).toBe(SettlementStatus.WIN);
      expect(result.even).toBe(SettlementStatus.LOSE);
    });

    it("should return even win", () => {
      const result = resultGeneratorService.getOddEvenResult(4);

      expect(result.odd).toBe(SettlementStatus.LOSE);
      expect(result.even).toBe(SettlementStatus.WIN);
    });

    it("should return even win for zero", () => {
      const result = resultGeneratorService.getOddEvenResult(0);

      expect(result.odd).toBe(SettlementStatus.LOSE);
      expect(result.even).toBe(SettlementStatus.WIN);
    });
  });

  describe("getTeamOverUnderResult", () => {
    it("should return home over and away under", () => {
      const result = resultGeneratorService.getTeamOverUnderResult(2, 1, 1.5, 1.5);

      expect(result.homeOver).toBe(SettlementStatus.WIN);
      expect(result.homeUnder).toBe(SettlementStatus.LOSE);
      expect(result.awayOver).toBe(SettlementStatus.LOSE);
      expect(result.awayUnder).toBe(SettlementStatus.WIN);
    });

    it("should return home under and away over", () => {
      const result = resultGeneratorService.getTeamOverUnderResult(1, 2, 1.5, 1.5);

      expect(result.homeOver).toBe(SettlementStatus.LOSE);
      expect(result.homeUnder).toBe(SettlementStatus.WIN);
      expect(result.awayOver).toBe(SettlementStatus.WIN);
      expect(result.awayUnder).toBe(SettlementStatus.LOSE);
    });

    it("should return draw for exact matches", () => {
      const result = resultGeneratorService.getTeamOverUnderResult(1, 1, 1, 1);

      expect(result.homeOver).toBe(SettlementStatus.DRAW);
      expect(result.homeUnder).toBe(SettlementStatus.DRAW);
      expect(result.awayOver).toBe(SettlementStatus.DRAW);
      expect(result.awayUnder).toBe(SettlementStatus.DRAW);
    });
  });

  describe("getSettlementResultFromResultString", () => {
    it("should calculate settlement for HH result", () => {
      const settleConfig = {
        overUnderValue: 2.5,
        handicapValue: -0.5,
        homeOverUnderValue: 1.5,
        awayOverUnderValue: 0.5,
      };

      const result = resultGeneratorService.getSettlementResultFromResultString("HH", settleConfig);

      expect(result.handicapHome).toBe(SettlementStatus.WIN);
      expect(result.handicapAway).toBe(SettlementStatus.LOSE);
      expect(result.home).toBe(SettlementStatus.WIN);
      expect(result.away).toBe(SettlementStatus.LOSE);
      expect(result.draw).toBe(SettlementStatus.LOSE);
      expect(result.over).toBe(SettlementStatus.LOSE);
      expect(result.under).toBe(SettlementStatus.WIN);
      expect(result.even).toBe(SettlementStatus.WIN);
      expect(result.odd).toBe(SettlementStatus.LOSE);
      expect(result.homeOver).toBe(SettlementStatus.WIN);
      expect(result.homeUnder).toBe(SettlementStatus.LOSE);
      expect(result.awayOver).toBe(SettlementStatus.LOSE);
      expect(result.awayUnder).toBe(SettlementStatus.WIN);
    });

    it("should calculate settlement for A result", () => {
      const settleConfig = {
        overUnderValue: 1.5,
        handicapValue: 0.5,
        homeOverUnderValue: 0.5,
        awayOverUnderValue: 1.5,
      };

      const result = resultGeneratorService.getSettlementResultFromResultString("A", settleConfig);

      expect(result.handicapHome).toBe(SettlementStatus.LOSE);
      expect(result.handicapAway).toBe(SettlementStatus.WIN);
      expect(result.home).toBe(SettlementStatus.LOSE);
      expect(result.away).toBe(SettlementStatus.WIN);
      expect(result.draw).toBe(SettlementStatus.LOSE);
      expect(result.over).toBe(SettlementStatus.LOSE);
      expect(result.under).toBe(SettlementStatus.WIN);
      expect(result.even).toBe(SettlementStatus.LOSE);
      expect(result.odd).toBe(SettlementStatus.WIN);
      expect(result.homeOver).toBe(SettlementStatus.LOSE);
      expect(result.homeUnder).toBe(SettlementStatus.WIN);
      expect(result.awayOver).toBe(SettlementStatus.LOSE);
      expect(result.awayUnder).toBe(SettlementStatus.WIN);
    });
  });

  describe("generateResultForHalf", () => {
    it("should generate result for half with single score", () => {
      const halfConfig = {
        scoreRate: { "1-0": 1 },
        overUnderValue: 1.5,
        handicapValue: -0.5,
        homeOverUnderValue: 0.5,
        awayOverUnderValue: 0.5,
      };

      const result = resultGeneratorService.generateResultForHalf(halfConfig);

      expect(result.goalSequence).toBe("H");
      expect(result.finalScore).toBe("1:0");
    });

    it("should generate result for half with multiple scores", () => {
      const halfConfig = {
        scoreRate: { "2-1": 1 },
        overUnderValue: 2.5,
        handicapValue: 0,
        homeOverUnderValue: 1.5,
        awayOverUnderValue: 0.5,
      };

      const result = resultGeneratorService.generateResultForHalf(halfConfig);

      expect(result.goalSequence).toMatch(/^[HA]{3}$/);
      expect(result.finalScore).toBe("2:1");
    });

    it("should handle zero score", () => {
      const halfConfig = {
        scoreRate: { "0-0": 1 },
        overUnderValue: 0.5,
        handicapValue: 0,
        homeOverUnderValue: 0.5,
        awayOverUnderValue: 0.5,
      };

      const result = resultGeneratorService.generateResultForHalf(halfConfig);

      expect(result.goalSequence).toBe("0");
      expect(result.finalScore).toBe("0:0");
    });
  });

  describe("getVideoInfoFromResult", () => {
    it("should generate video info for different results", () => {
      const result = resultGeneratorService.getVideoInfoFromResult("H", "A", NUMBER_OF_VIDEOS);

      expect(result.firstHalfVideo).toBeDefined();
      expect(result.secondHalfVideo).toBeDefined();
      expect(result.firstHalfVideo).not.toBe(result.secondHalfVideo);
    });

    it("should generate video info for same results", () => {
      const result = resultGeneratorService.getVideoInfoFromResult("H", "H", NUMBER_OF_VIDEOS);

      expect(result.firstHalfVideo).toBeDefined();
      expect(result.secondHalfVideo).toBeDefined();
      // When there's only 1 video available, they might be the same
      // The implementation should handle this by ensuring different videos when possible
      expect(typeof result.firstHalfVideo).toBe("string");
      expect(typeof result.secondHalfVideo).toBe("string");
    });
  });

  describe("getSettlementResult", () => {
    const matchConfig = {
      gameTiming: mockContainer.gameSettings.gameTiming,
      numberOfEventDetails: mockContainer.gameSettings.gameTiming.timelines.length,
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
        const result = resultGeneratorService.getSettlementResult(roundResult, matchConfig);

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
        const result = resultGeneratorService.getSettlementResult(roundResult, newMatchConfig);

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
        const result = resultGeneratorService.getSettlementResult(roundResult, newMatchConfig);

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
        const result = resultGeneratorService.getSettlementResult(roundResult, newMatchConfig);

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
        const result = resultGeneratorService.getSettlementResult(roundResult, newMatchConfig);

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
