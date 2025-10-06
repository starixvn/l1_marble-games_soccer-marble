import { ResultGeneratorService } from "../../../src/services/result-generator-service";
import { SettlementStatus } from "@soccer-marble/soccer-marble-base";
import type { MatchConfig, RoundResult, DataResultType, ResultType } from "@soccer-marble/soccer-marble-base";
import type { OddsInfo } from "../../../src/types";
import crypto from "crypto";
import { mockContainer } from "../global-stubs";

const NUMBER_OF_VIDEOS = {
  HAA: 1,
  AHH: 2,
  A: 1,
  H: 1,
};

describe("ResultGeneratorService tests", () => {
  let resultGeneratorService: ResultGeneratorService;

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
            afterGoalDuration: 3,
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

  describe("generateResult", () => {
    it("should return a valid result based on match config", () => {
      const data: DataResultType = {
        numberOfVideos: NUMBER_OF_VIDEOS,
        matchConfig: {
          gameTiming: {} as any,
          numberOfEventDetails: 2,
          eventDetailInfos: [
            {
              rateConfig: { scoreRate: { "1-0": 1 } } as any,
              phase: 0,
              oddsInfo: {} as any,
              videoLength: 10,
            },
            {
              rateConfig: { scoreRate: { "0-1": 1 } } as any,
              phase: 1,
              oddsInfo: {} as any,
              videoLength: 10,
            },
          ],
          rateConfig: {} as any,
          oddsInfo: {} as any,
        },
      };

      const firstHalfVideo = crypto.createHash("sha256").update(`A-0`).digest("hex");
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

      const result = resultGeneratorService.generateResult(data);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedFirstHalfResult);
      expect(result[1]).toEqual(expectedSecondHalfResult);
    });
  });
});
