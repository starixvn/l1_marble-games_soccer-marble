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

  describe("generateResult", () => {
    it("should return a valid result based on match config", () => {
      // Arrange
      const matchConfig = {
        gameTiming: {} as any,
        numberOfEventDetails: 2,
        eventDetailInfos: [
          {
            rateConfig: {
              scoreRate: {
                "1-0": 1,
              },
            },
            oddsInfo: {} as any,
            phase: 0,
          },
          {
            rateConfig: {
              scoreRate: {
                "0-1": 1,
              },
            },
            oddsInfo: {} as any,
            phase: 1,
          },
        ],
        rateConfig: {} as any,
        oddsInfo: {} as any,
      };

      const firstHalfVideo = crypto.createHash("sha256").update(`H-0`).digest("hex");
      const secondHalfVideo = crypto.createHash("sha256").update(`A-0`).digest("hex");

      const expectedFirstHalfResult = {
        playlist: firstHalfVideo,
        goalInfo: firstHalfVideo,
        result: { goalSequence: "H", finalScore: "1:0" },
        phase: 0,
      };

      const expectedSecondHalfResult = {
        playlist: secondHalfVideo,
        goalInfo: secondHalfVideo,
        result: { goalSequence: "A", finalScore: "0:1" },
        phase: 1,
      };

      // Act
      const result = resultGeneratorService.generateResult({
        numberOfVideos: NUMBER_OF_VIDEOS,
        matchConfig: matchConfig as any,
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedFirstHalfResult);
      expect(result[1]).toEqual(expectedSecondHalfResult);
    });
  });

  describe("generateSettlementResultFromResult", () => {
    it("should calculate settlement for HH result", () => {
      const settleConfig = {
        overUnderValue: 2.5,
        handicapValue: -0.5,
        homeOverUnderValue: 1.5,
        awayOverUnderValue: 0.5,
      };

      const result = resultGeneratorService.generateSettlementResultFromResult(
        { goalSequence: "HH", finalScore: "2:0" },
        settleConfig
      );

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

      const result = resultGeneratorService.generateSettlementResultFromResult(
        { goalSequence: "A", finalScore: "0:1" },
        settleConfig
      );

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

  describe("generateResultFromRate", () => {
    it("should generate result for half with single score", () => {
      const halfConfig = {
        scoreRate: { "1-0": 1 },
        overUnderValue: 1.5,
        handicapValue: -0.5,
        homeOverUnderValue: 0.5,
        awayOverUnderValue: 0.5,
      };

      const result = resultGeneratorService.generateResultFromRate(halfConfig);

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

      const result = resultGeneratorService.generateResultFromRate(halfConfig);

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

      const result = resultGeneratorService.generateResultFromRate(halfConfig);

      expect(result.goalSequence).toBe("0");
      expect(result.finalScore).toBe("0:0");
    });
  });

  describe("generateVideoInfoFromResult", () => {
    it("should generate video info for different results", () => {
      const result = resultGeneratorService.generateVideoInfoFromResult("H", "A", NUMBER_OF_VIDEOS);

      expect(result.firstHalfVideo).toBeDefined();
      expect(result.secondHalfVideo).toBeDefined();
      expect(result.firstHalfVideo).not.toBe(result.secondHalfVideo);
    });

    it("should generate video info for same results", () => {
      const result = resultGeneratorService.generateVideoInfoFromResult("H", "H", NUMBER_OF_VIDEOS);

      expect(result.firstHalfVideo).toBeDefined();
      expect(result.secondHalfVideo).toBeDefined();
      // When there's only 1 video available, they might be the same
      // The implementation should handle this by ensuring different videos when possible
      expect(typeof result.firstHalfVideo).toBe("string");
      expect(typeof result.secondHalfVideo).toBe("string");
    });
  });

  describe("generateSettlementResult", () => {
    const matchConfig = {
      gameTiming: mockContainer.gameSettings.gameTiming,
      numberOfEventDetails: mockContainer.gameSettings.gameTiming.timelines.length,
      eventDetailInfos: [
        {
          rateConfig: {
            scoreRate: { "1-0": 1 },
          },
          oddsInfo: {
            overUnderValue: 1.5,
            handicapValue: -0.5,
            homeOverUnderValue: 0.5,
            awayOverUnderValue: 0.5,
          },
          phase: 0,
        },
        {
          rateConfig: {
            scoreRate: { "0-1": 1 },
          },
          oddsInfo: {
            overUnderValue: 1.5,
            handicapValue: 0,
            homeOverUnderValue: 0.5,
            awayOverUnderValue: 0.5,
          },
          phase: 1,
        },
      ],
      rateConfig: {} as any,
      oddsInfo: {
        overUnderValue: 2.5,
        handicapValue: -0.5,
        homeOverUnderValue: 1.5,
        awayOverUnderValue: 1.5,
      },
    };
    describe("with round result [2:0, 0:1]", () => {
      it("should correctly settle all bets", () => {
        // Arrange
        const roundResult = [
          {
            playlist: "test-video-1",
            goalInfo: "test-video-1",
            result: { goalSequence: "HH", finalScore: "2:0" },
            phase: 0,
          },
          {
            playlist: "test-video-2",
            goalInfo: "test-video-2",
            result: { goalSequence: "A", finalScore: "0:1" },
            phase: 1,
          },
        ];

        // Act
        const result = resultGeneratorService.generateSettlementResult(roundResult, matchConfig as any);

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
        const roundResult = [
          {
            playlist: "test-video-2",
            goalInfo: "test-video-2",
            result: { goalSequence: "A", finalScore: "0:1" },
            phase: 0,
          },
          {
            playlist: "test-video-1",
            goalInfo: "test-video-1",
            result: { goalSequence: "H", finalScore: "1:0" },
            phase: 1,
          },
        ];

        const newMatchConfig = {
          ...matchConfig,
          oddsInfo: {
            ...matchConfig.oddsInfo,
            handicapValue: 0,
          },
        };

        // Act
        const result = resultGeneratorService.generateSettlementResult(roundResult, newMatchConfig as any);

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
        const roundResult = [
          {
            playlist: "test-video-1",
            goalInfo: "test-video-1",
            result: { goalSequence: "A", finalScore: "0:1" },
            phase: 0,
          },
          {
            playlist: "test-video-2",
            goalInfo: "test-video-2",
            result: { goalSequence: "A", finalScore: "0:1" },
            phase: 1,
          },
        ];

        const newMatchConfig = {
          ...matchConfig,
          eventDetailInfos: [
            {
              ...matchConfig.eventDetailInfos[0],
              oddsInfo: {
                ...matchConfig.eventDetailInfos[0].oddsInfo,
                handicapValue: 1,
              },
            },
            matchConfig.eventDetailInfos[1],
          ],
        };

        // Act
        const result = resultGeneratorService.generateSettlementResult(roundResult, newMatchConfig as any);

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
        const roundResult = [
          {
            playlist: "test-video-1",
            goalInfo: "test-video-1",
            result: { goalSequence: "HA", finalScore: "1:1" },
            phase: 0,
          },
          {
            playlist: "test-video-2",
            goalInfo: "test-video-2",
            result: { goalSequence: "H", finalScore: "1:0" },
            phase: 1,
          },
        ];

        const newMatchConfig = {
          ...matchConfig,
          eventDetailInfos: [
            {
              ...matchConfig.eventDetailInfos[0],
              oddsInfo: {
                ...matchConfig.eventDetailInfos[0].oddsInfo,
                handicapValue: 0,
              },
            },
            matchConfig.eventDetailInfos[1],
          ],
          oddsInfo: {
            ...matchConfig.oddsInfo,
            handicapValue: 0,
          },
        };

        // Act
        const result = resultGeneratorService.generateSettlementResult(roundResult, newMatchConfig as any);

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
        const roundResult = [
          {
            playlist: "test-video-1",
            goalInfo: "test-video-1",
            result: { goalSequence: "HHAH", finalScore: "3:1" },
            phase: 0,
          },
          {
            playlist: "test-video-2",
            goalInfo: "test-video-2",
            result: { goalSequence: "H", finalScore: "1:0" },
            phase: 1,
          },
        ];

        const newMatchConfig = {
          ...matchConfig,
          eventDetailInfos: [
            {
              ...matchConfig.eventDetailInfos[0],
              oddsInfo: {
                ...matchConfig.eventDetailInfos[0].oddsInfo,
                overUnderValue: 2.5,
                handicapValue: 0,
              },
            },
            matchConfig.eventDetailInfos[1],
          ],
          oddsInfo: {
            ...matchConfig.oddsInfo,
            overUnderValue: 3.5,
            handicapValue: 0,
          },
        };

        // Act
        const result = resultGeneratorService.generateSettlementResult(roundResult, newMatchConfig as any);

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
