import { ResultGeneratorService } from "../../../src/services/result-generator-service";
import { SettlementStatus } from "@soccer-marble/soccer-marble-base";
import type {
  MatchConfig,
  RoundResult,
  DataResultType,
  ResultType,
  GameTiming,
} from "@soccer-marble/soccer-marble-base";
import type { OddsInfo } from "../../../src/types";
import crypto from "crypto";
import { mockContainer } from "../global-stubs";
import { MIN_VIDEO_LENGTH, MAX_VIDEO_LENGTH } from "../../../src/constant";
import * as rngModule from "sc-core-rng";

jest.mock("sc-core-rng");

const NUMBER_OF_VIDEOS = {
  A100: 1,
  A101: 1,
  H100: 1,
  H101: 1,
  "0101": 1,
};

describe("ResultGeneratorService tests", () => {
  let resultGeneratorService: ResultGeneratorService;

  const mockGameSettings = {
    gameId: 2004,
    gameTiming: {
      extraInfo: {
        videoLength: 40,
        oddsDuration: 10,
        resultDuration: 5,
        halfTimeDuration: 15,
        preloadDuration: 5,
        blockBetDuration: 3,
      },
    } as GameTiming,
    numberOfVideos: {
      H: 10,
      A: 10,
    },
    teams: ["Team A", "Team B"],
    theme: "Test Theme",
  };

  beforeEach(() => {
    resultGeneratorService = new ResultGeneratorService(mockContainer);
  });

  describe("generateSettlementResult", () => {
    it("should generate settlement result for ultra live with first and second half", () => {
      const roundResult: RoundResult = [
        {
          playlist: "691a386e90d257bbafc2cebcdf7d655d0b329e38bdeef972b64023f36ecfda10",
          goalInfo: "691a386e90d257bbafc2cebcdf7d655d0b329e38bdeef972b64023f36ecfda10",
          result: {
            goalSequence: "H",
            finalScore: "1:0",
          },
          phase: 0,
        },
        {
          playlist: "fc61ab1c6eec439ca31ae6ee13dc431fba42210d8cb18573ee7cc89447e56139",
          goalInfo: "fc61ab1c6eec439ca31ae6ee13dc431fba42210d8cb18573ee7cc89447e56139",
          result: {
            goalSequence: "A",
            finalScore: "0:1",
          },
          phase: 0,
        },
        {
          playlist: "dd97de36648f7794c95c6b3a4b6d4991157f068565ac5c55c1d7395e9f798775",
          goalInfo: "dd97de36648f7794c95c6b3a4b6d4991157f068565ac5c55c1d7395e9f798775",
          result: {
            goalSequence: "A",
            finalScore: "0:1",
          },
          phase: 0,
        },
        {
          playlist: "22841ea360fc3c3676a38502aa9a90a1ae1fbdac1d937746358efe559d349b6f",
          goalInfo: "22841ea360fc3c3676a38502aa9a90a1ae1fbdac1d937746358efe559d349b6f",
          result: {
            goalSequence: "A",
            finalScore: "0:1",
          },
          phase: 0,
        },
        {
          playlist: "3cccbcd7a3c8b57712028d47933f81f26729851fcbc2db775f952e033eb79c3e",
          goalInfo: "3cccbcd7a3c8b57712028d47933f81f26729851fcbc2db775f952e033eb79c3e",
          result: {
            goalSequence: "H",
            finalScore: "1:0",
          },
          phase: 1,
        },
        {
          playlist: "8b1781c5ea0175aa538cb729697ba7d50f7c594127d65eb6e7e210fe36e6bcc7",
          goalInfo: "8b1781c5ea0175aa538cb729697ba7d50f7c594127d65eb6e7e210fe36e6bcc7",
          result: {
            goalSequence: "A",
            finalScore: "0:1",
          },
          phase: 1,
        },
        {
          playlist: "22841ea360fc3c3676a38502aa9a90a1ae1fbdac1d937746358efe559d349b6f",
          goalInfo: "22841ea360fc3c3676a38502aa9a90a1ae1fbdac1d937746358efe559d349b6f",
          result: {
            goalSequence: "H",
            finalScore: "1:0",
          },
          phase: 1,
        },
      ];

      const matchConfig: MatchConfig = {
        gameTiming: {
          wholeRound: 100,
          timelines: [
            {
              OddsAvailable: 0,
              ScheduleStart: 10,
              ResultAvailable: 18,
            },
            {
              OddsAvailable: 10,
              ScheduleStart: 21,
              ResultAvailable: 29,
            },
            {
              OddsAvailable: 21,
              ScheduleStart: 32,
              ResultAvailable: 38,
            },
            {
              OddsAvailable: 32,
              ScheduleStart: 41,
              ResultAvailable: 51,
            },
            {
              OddsAvailable: 51,
              ScheduleStart: 71,
              ResultAvailable: 78,
            },
            {
              OddsAvailable: 71,
              ScheduleStart: 81,
              ResultAvailable: 88,
            },
            {
              OddsAvailable: 81,
              ScheduleStart: 91,
              ResultAvailable: 109,
            },
          ],
          extraInfo: {
            videoLength: 32,
            oddsDuration: 10,
            resultDuration: 10,
            halfTimeDuration: 20,
            preloadDuration: 3,
          },
        },
        numberOfEventDetails: 7,
        eventDetailInfos: [
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.45,
                "0-1": 0.55,
              },
            },
            phase: 0,
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 3.5,
            },
          },
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.45,
                "0-1": 0.55,
              },
            },
            phase: 0,
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 2.5,
            },
          },
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.45,
                "0-1": 0.55,
              },
            },
            phase: 0,
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 1.5,
            },
          },
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.25,
                "0-1": 0.25,
                "0-0": 0.5,
              },
            },
            phase: 0,
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 0.5,
            },
          },
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.45,
                "0-1": 0.55,
              },
            },
            phase: 1,
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 2.5,
            },
          },
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.45,
                "0-1": 0.55,
              },
            },
            phase: 1,
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 1.5,
            },
          },
          {
            rateConfig: {
              scoreRate: {
                "1-0": 0.25,
                "0-1": 0.25,
                "0-0": 0.5,
              },
            },
            phase: 1,
            oddsInfo: {
              handicapValue: 0.5,
              overUnderValue: 0.5,
            },
          },
        ],
        rateConfig: {
          scoreRate: {
            "7-0": 0.0011533007812500004,
            "6-1": 0.009354550781250002,
            "6-0": 0.004613203125000001,
            "5-2": 0.032477519531250006,
            "5-1": 0.03280500000000001,
            "4-3": 0.06256142578125001,
            "4-2": 0.09710507812500002,
            "3-4": 0.07221005859375002,
            "3-3": 0.15314062500000003,
            "5-0": 0.004613203125000001,
            "4-1": 0.028191796875000008,
            "3-2": 0.06891328125000001,
            "2-5": 0.04993849609375002,
            "2-4": 0.13569960937500003,
            "2-3": 0.08422734375000002,
            "1-6": 0.01915912109375001,
            "1-5": 0.06405437500000002,
            "1-4": 0.05147226562500001,
            "0-7": 0.0031455273437500015,
            "0-6": 0.012582109375000006,
            "0-5": 0.012582109375000006,
          },
        },
        oddsInfo: [
          {
            handicapValue: 0.5,
            overUnderValue: 6.5,
          },
          {
            handicapValue: 0.5,
            overUnderValue: 5.5,
          },
          {
            handicapValue: 0.5,
            overUnderValue: 4.5,
          },
          {
            handicapValue: 0.5,
            overUnderValue: 3.5,
          },
        ],
      };

      const result = resultGeneratorService.generateSettlementResult(roundResult, matchConfig);

      expect(result).toEqual([
        {
          ft_1x2_home: "L",
          ft_1x2_away: "W",
          ft_1x2_draw: "L",
          ft_oe_odd: "W",
          ft_oe_even: "L",
          ft_hdp_home: "L",
          ft_hdp_away: "W",
          ft_ou_over: "W",
          ft_ou_under: "L",
          h1_1x2_home: "L",
          h1_1x2_away: "W",
          h1_1x2_draw: "L",
          h1_oe_odd: "L",
          h1_oe_even: "W",
          h1_hdp_home: "L",
          h1_hdp_away: "W",
          h1_ou_over: "W",
          h1_ou_under: "L",
        },
        {
          ft_1x2_home: "L",
          ft_1x2_away: "W",
          ft_1x2_draw: "L",
          ft_oe_odd: "W",
          ft_oe_even: "L",
          ft_hdp_home: "L",
          ft_hdp_away: "W",
          ft_ou_over: "W",
          ft_ou_under: "L",
          h1_1x2_home: "L",
          h1_1x2_away: "W",
          h1_1x2_draw: "L",
          h1_oe_odd: "L",
          h1_oe_even: "W",
          h1_hdp_home: "L",
          h1_hdp_away: "W",
          h1_ou_over: "W",
          h1_ou_under: "L",
        },
        {
          ft_1x2_home: "L",
          ft_1x2_away: "W",
          ft_1x2_draw: "L",
          ft_oe_odd: "W",
          ft_oe_even: "L",
          ft_hdp_home: "L",
          ft_hdp_away: "W",
          ft_ou_over: "W",
          ft_ou_under: "L",
          h1_1x2_home: "L",
          h1_1x2_away: "W",
          h1_1x2_draw: "L",
          h1_oe_odd: "L",
          h1_oe_even: "W",
          h1_hdp_home: "L",
          h1_hdp_away: "W",
          h1_ou_over: "W",
          h1_ou_under: "L",
        },
        {
          ft_1x2_home: "L",
          ft_1x2_away: "W",
          ft_1x2_draw: "L",
          ft_oe_odd: "W",
          ft_oe_even: "L",
          ft_hdp_home: "W",
          ft_hdp_away: "L",
          ft_ou_over: "W",
          ft_ou_under: "L",
          h1_1x2_home: "L",
          h1_1x2_away: "W",
          h1_1x2_draw: "L",
          h1_oe_odd: "L",
          h1_oe_even: "W",
          h1_hdp_home: "L",
          h1_hdp_away: "W",
          h1_ou_over: "W",
          h1_ou_under: "L",
        },
        {
          ft_1x2_home: "L",
          ft_1x2_away: "W",
          ft_1x2_draw: "L",
          ft_oe_odd: "W",
          ft_oe_even: "L",
          ft_hdp_home: "W",
          ft_hdp_away: "L",
          ft_ou_over: "W",
          ft_ou_under: "L",
        },
        {
          ft_1x2_home: "L",
          ft_1x2_away: "W",
          ft_1x2_draw: "L",
          ft_oe_odd: "W",
          ft_oe_even: "L",
          ft_hdp_home: "W",
          ft_hdp_away: "L",
          ft_ou_over: "W",
          ft_ou_under: "L",
        },
        {
          ft_1x2_home: "L",
          ft_1x2_away: "W",
          ft_1x2_draw: "L",
          ft_oe_odd: "W",
          ft_oe_even: "L",
          ft_hdp_home: "W",
          ft_hdp_away: "L",
          ft_ou_over: "W",
          ft_ou_under: "L",
        },
      ]);
    });
  });

  describe("generateSettlementResultFromResult", () => {
    it("should calculate settlement for HH result", () => {
      const result: ResultType = { goalSequence: "HH", finalScore: "2:0" };
      const oddsInfo: OddsInfo = {
        handicapValue: -0.5,
        overUnderValue: 2.5,
      };

      const settlement = resultGeneratorService.generateSettlementResultFromResult(result, oddsInfo);

      expect(settlement.handicapHome).toBe(SettlementStatus.WIN);
      expect(settlement.handicapAway).toBe(SettlementStatus.LOSE);
      expect(settlement.home).toBe(SettlementStatus.WIN);
      expect(settlement.away).toBe(SettlementStatus.LOSE);
      expect(settlement.draw).toBe(SettlementStatus.LOSE);
      expect(settlement.over).toBe(SettlementStatus.LOSE);
      expect(settlement.under).toBe(SettlementStatus.WIN);
      expect(settlement.even).toBe(SettlementStatus.WIN);
      expect(settlement.odd).toBe(SettlementStatus.LOSE);
    });

    it("should calculate settlement for A result", () => {
      const result: ResultType = { goalSequence: "A", finalScore: "0:1" };
      const oddsInfo: OddsInfo = {
        handicapValue: 0.5,
        overUnderValue: 1.5,
      };

      const settlement = resultGeneratorService.generateSettlementResultFromResult(result, oddsInfo);

      expect(settlement.handicapHome).toBe(SettlementStatus.LOSE);
      expect(settlement.handicapAway).toBe(SettlementStatus.WIN);
      expect(settlement.home).toBe(SettlementStatus.LOSE);
      expect(settlement.away).toBe(SettlementStatus.WIN);
      expect(settlement.draw).toBe(SettlementStatus.LOSE);
      expect(settlement.over).toBe(SettlementStatus.LOSE);
      expect(settlement.under).toBe(SettlementStatus.WIN);
      expect(settlement.even).toBe(SettlementStatus.LOSE);
      expect(settlement.odd).toBe(SettlementStatus.WIN);
    });
  });

  describe("generateVideoLengthForPhase", () => {
    it.each([2, 3, 4])("should generate video lengths for phase with size %d", (size) => {
      // Restore the real secureRandomRange function
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureRandomRange).mockImplementation(actualRng.secureRandomRange);

      const result = resultGeneratorService.generateVideoLengthForPhase(size);

      expect(result).toHaveLength(size);
      expect(result.every((length) => length >= MIN_VIDEO_LENGTH)).toBe(true);
      expect(result.every((length) => length <= MAX_VIDEO_LENGTH)).toBe(true);
      expect(result.reduce((sum, length) => sum + length, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);
    });
  });

  describe("generateResultFromRateConfigs", () => {
    it("should generate results from multiple rate configs", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureWeightedPick).mockImplementation((array: unknown[]) => array[0]);
      jest.mocked(rngModule.secureShuffle).mockImplementation(actualRng.secureShuffle);

      const rateConfigs = [
        { scoreRate: { "1-0": 1 } },
        { scoreRate: { "0-1": 1 } },
        { scoreRate: { "2-0": 1 } },
      ] as any[];

      const results = resultGeneratorService.generateResultFromRateConfigs(rateConfigs);

      expect(results).toHaveLength(3);
      expect(results[0].finalScore).toBe("1:0");
      expect(results[1].finalScore).toBe("0:1");
      expect(results[2].finalScore).toBe("2:0");
      // Goal sequences should be shuffled
      expect(results[0].goalSequence).toContain("H");
      expect(results[1].goalSequence).toContain("A");
      expect(results[2].goalSequence).toContain("H");
    });

    it("should handle empty rate configs", () => {
      const rateConfigs = [] as any[];

      const results = resultGeneratorService.generateResultFromRateConfigs(rateConfigs);

      expect(results).toHaveLength(0);
    });

    it("should handle draw results", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureWeightedPick).mockImplementation((array: unknown[]) => array[0]);
      jest.mocked(rngModule.secureShuffle).mockImplementation(actualRng.secureShuffle);

      const rateConfigs = [{ scoreRate: { "0-0": 1 } }] as any[];

      const results = resultGeneratorService.generateResultFromRateConfigs(rateConfigs);

      expect(results).toHaveLength(1);
      expect(results[0].finalScore).toBe("0:0");
      expect(results[0].goalSequence).toBe("0");
    });
  });

  describe("generateResultAndVideoLengthForHalf", () => {
    it("should generate results and video lengths for a half", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureRandomRange).mockImplementation(actualRng.secureRandomRange);

      const spy = jest.spyOn(resultGeneratorService, "generateVideoNameForUltraLive");
      spy.mockReturnValue("mocked-video-hash");

      const halfResults: ResultType[] = [
        { goalSequence: "H", finalScore: "1:0" },
        { goalSequence: "A", finalScore: "0:1" },
        { goalSequence: "H", finalScore: "1:0" },
      ];

      const { results, videoLengths } = resultGeneratorService.generateResultAndVideoLengthForHalf(halfResults, 0);

      expect(results).toHaveLength(3);
      expect(videoLengths).toHaveLength(3);
      expect(videoLengths.reduce((sum, len) => sum + len, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);

      // Check that results have correct structure
      expect(results[0].result).toEqual(halfResults[0]);
      expect(results[0].phase).toBe(0);
      expect(results[0].playlist).toBe("mocked-video-hash");
      expect(results[0].goalInfo).toBe("mocked-video-hash");

      // Check that last block is marked as last (isLastBlock = true)
      expect(spy).toHaveBeenCalledWith("H", true, expect.any(Number));

      spy.mockRestore();
    });

    it("should generate results for phase 1", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureRandomRange).mockImplementation(actualRng.secureRandomRange);

      const spy = jest.spyOn(resultGeneratorService, "generateVideoNameForUltraLive");
      spy.mockReturnValue("mocked-video-hash-2");

      const halfResults: ResultType[] = [
        { goalSequence: "AA", finalScore: "0:2" },
        { goalSequence: "H", finalScore: "1:0" },
      ];

      const { results, videoLengths } = resultGeneratorService.generateResultAndVideoLengthForHalf(halfResults, 1);

      expect(results).toHaveLength(2);
      expect(videoLengths).toHaveLength(2);
      expect(results[0].phase).toBe(1);
      expect(results[1].phase).toBe(1);
      expect(results[0].playlist).toBe("mocked-video-hash-2");

      spy.mockRestore();
    });

    it("should mark non-last blocks correctly", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureRandomRange).mockImplementation(actualRng.secureRandomRange);

      const spy = jest.spyOn(resultGeneratorService, "generateVideoNameForUltraLive");
      spy.mockReturnValue("mocked-video");

      const halfResults: ResultType[] = [
        { goalSequence: "H", finalScore: "1:0" },
        { goalSequence: "A", finalScore: "0:1" },
      ];

      resultGeneratorService.generateResultAndVideoLengthForHalf(halfResults, 0);

      // First call should be with isLastBlock = false
      expect(spy).toHaveBeenCalledWith("H", false, expect.any(Number));
      // Second call should be with isLastBlock = true
      expect(spy).toHaveBeenCalledWith("A", true, expect.any(Number));

      spy.mockRestore();
    });
  });

  describe("generateResultAndVideoLengthForHalfWithRetry", () => {
    it("should succeed on first attempt when generation is successful", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureRandomRange).mockImplementation(actualRng.secureRandomRange);

      const spy = jest.spyOn(resultGeneratorService, "generateVideoNameForUltraLive");
      spy.mockReturnValue("mocked-video-hash");

      const halfResults: ResultType[] = [
        { goalSequence: "H", finalScore: "1:0" },
        { goalSequence: "A", finalScore: "0:1" },
      ];

      const { results, videoLengths } = resultGeneratorService.generateResultAndVideoLengthForHalfWithRetry(
        halfResults,
        0
      );

      expect(results).toHaveLength(2);
      expect(videoLengths).toHaveLength(2);
      expect(videoLengths.reduce((sum, len) => sum + len, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);

      spy.mockRestore();
    });

    it("should retry on failure and eventually succeed", () => {
      let attemptCount = 0;
      const spy = jest.spyOn(resultGeneratorService, "generateResultAndVideoLengthForHalf");

      spy.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Test error");
        }
        return {
          results: [
            {
              playlist: "test",
              goalInfo: "test",
              result: { goalSequence: "H", finalScore: "1:0" },
              phase: 0,
            },
          ],
          videoLengths: [40],
        };
      });

      const halfResults: ResultType[] = [{ goalSequence: "H", finalScore: "1:0" }];

      const { results, videoLengths } = resultGeneratorService.generateResultAndVideoLengthForHalfWithRetry(
        halfResults,
        0
      );

      expect(attemptCount).toBe(3);
      expect(results).toHaveLength(1);
      expect(videoLengths).toEqual([40]);

      spy.mockRestore();
    });

    it("should throw error after max attempts", () => {
      const spy = jest.spyOn(resultGeneratorService, "generateResultAndVideoLengthForHalf");

      spy.mockImplementation(() => {
        throw new Error("Persistent error");
      });

      const halfResults: ResultType[] = [{ goalSequence: "H", finalScore: "1:0" }];

      expect(() => {
        resultGeneratorService.generateResultAndVideoLengthForHalfWithRetry(halfResults, 0, 5);
      }).toThrow("Failed to generate half results after 5 attempts");

      spy.mockRestore();
    });

    it("should log warning on retry attempts", () => {
      let attemptCount = 0;
      const spy = jest.spyOn(resultGeneratorService, "generateResultAndVideoLengthForHalf");
      const logSpy = jest.spyOn(mockContainer.logService, "logWarning");

      spy.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error("Retry test error");
        }
        return {
          results: [
            {
              playlist: "test",
              goalInfo: "test",
              result: { goalSequence: "H", finalScore: "1:0" },
              phase: 0,
            },
          ],
          videoLengths: [40],
        };
      });

      const halfResults: ResultType[] = [{ goalSequence: "H", finalScore: "1:0" }];

      resultGeneratorService.generateResultAndVideoLengthForHalfWithRetry(halfResults, 0);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Error generating half results"));

      spy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe("generateResultForUltraLivePhase", () => {
    it("should generate results for ultra live phase", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureRandomRange).mockImplementation(actualRng.secureRandomRange);
      jest.mocked(rngModule.secureWeightedPick).mockImplementation((array: unknown[]) => array[0]);
      jest.mocked(rngModule.secureShuffle).mockImplementation(actualRng.secureShuffle);

      const spy = jest.spyOn(resultGeneratorService, "generateVideoNameForUltraLive");
      spy.mockReturnValue("mocked-video-hash");

      const rateConfigs = [
        { scoreRate: { "1-0": 1 } },
        { scoreRate: { "0-1": 1 } },
        { scoreRate: { "1-0": 1 } },
      ] as any[];

      const { results, videoLengths } = resultGeneratorService.generateResultForUltraLivePhase(rateConfigs, 0);

      expect(results).toHaveLength(3);
      expect(videoLengths).toHaveLength(3);
      expect(videoLengths.reduce((sum, len) => sum + len, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);
      expect(results[0].phase).toBe(0);
      expect(results[1].phase).toBe(0);
      expect(results[2].phase).toBe(0);

      spy.mockRestore();
    });

    it("should generate results for phase 1", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureRandomRange).mockImplementation(actualRng.secureRandomRange);
      jest.mocked(rngModule.secureWeightedPick).mockImplementation((array: unknown[]) => array[0]);
      jest.mocked(rngModule.secureShuffle).mockImplementation(actualRng.secureShuffle);

      const spy = jest.spyOn(resultGeneratorService, "generateVideoNameForUltraLive");
      spy.mockReturnValue("mocked-video-hash");

      const rateConfigs = [{ scoreRate: { "2-0": 1 } }, { scoreRate: { "0-2": 1 } }] as any[];

      const { results, videoLengths } = resultGeneratorService.generateResultForUltraLivePhase(rateConfigs, 1);

      expect(results).toHaveLength(2);
      expect(videoLengths).toHaveLength(2);
      expect(results[0].phase).toBe(1);
      expect(results[1].phase).toBe(1);

      spy.mockRestore();
    });

    it("should use retry logic internally", () => {
      const actualRng = jest.requireActual("sc-core-rng");
      jest.mocked(rngModule.secureRandomRange).mockImplementation(actualRng.secureRandomRange);
      jest.mocked(rngModule.secureWeightedPick).mockImplementation((array: unknown[]) => array[0]);
      jest.mocked(rngModule.secureShuffle).mockImplementation(actualRng.secureShuffle);

      const retrySpy = jest.spyOn(resultGeneratorService, "generateResultAndVideoLengthForHalfWithRetry");
      const videoSpy = jest.spyOn(resultGeneratorService, "generateVideoNameForUltraLive");
      videoSpy.mockReturnValue("mocked-video");

      const rateConfigs = [{ scoreRate: { "1-0": 1 } }] as any[];

      resultGeneratorService.generateResultForUltraLivePhase(rateConfigs, 0);

      expect(retrySpy).toHaveBeenCalledWith(expect.any(Array), 0);

      retrySpy.mockRestore();
      videoSpy.mockRestore();
    });
  });
});
