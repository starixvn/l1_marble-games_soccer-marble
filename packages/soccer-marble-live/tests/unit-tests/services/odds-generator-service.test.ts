import { OddsGeneratorService } from "../../../src/services/odds-generator-service";
import type { MatchConfig, RoundResult } from "@soccer-marble/soccer-marble-base";

describe("OddsGeneratorService Tests", () => {
  let oddsGeneratorService: OddsGeneratorService;

  beforeEach(() => {
    oddsGeneratorService = new OddsGeneratorService();
  });

  describe("calculateOddsInfo", () => {
    it("should calculate odds info from score rates", () => {
      const scoreRates = {
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
      };

      const result = oddsGeneratorService.calculateOddsInfo(scoreRates);

      expect(result).toEqual({
        handicapValue: 0.5,
        overUnderValue: 6.5,
      });
    });
  });

  describe("calculateOddsForUltraLive", () => {
    it("should calculate odds for ultra live with first and second half", () => {
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

      const result: RoundResult = [
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
      const odds = oddsGeneratorService.calculateOddsForUltraLive(matchConfig, result);

      expect(odds).toEqual([
        {
          h1_hdp_home: 1.89,
          h1_hdp_away: 2.11,
          h1_1x2_home: 2.92,
          h1_1x2_away: 2.11,
          h1_1x2_draw: 5.38,
          h1_ou_over: 2,
          h1_ou_under: 2,
          h1_oe_odd: 2,
          h1_oe_even: 2,
          ft_hdp_home: 2.02,
          ft_hdp_away: 1.97,
          ft_1x2_home: 2.92,
          ft_1x2_away: 1.97,
          ft_1x2_draw: 6.52,
          ft_ou_over: 4,
          ft_ou_under: 1.33,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
        {
          h1_hdp_home: 1.74,
          h1_hdp_away: 2.34,
          h1_1x2_home: 1.74,
          h1_1x2_away: 4.4,
          h1_1x2_draw: 5.01,
          h1_ou_over: 2,
          h1_ou_under: 2,
          h1_oe_odd: 2,
          h1_oe_even: 2,
          ft_hdp_home: 1.94,
          ft_hdp_away: 2.05,
          ft_1x2_home: 1.94,
          ft_1x2_away: 3.12,
          ft_1x2_draw: 5.99,
          ft_ou_over: 3.99,
          ft_ou_under: 1.33,
          ft_oe_odd: 1.99,
          ft_oe_even: 2,
        },
        {
          h1_hdp_home: 1.7,
          h1_hdp_away: 2.42,
          h1_1x2_home: 2.96,
          h1_1x2_away: 2.42,
          h1_1x2_draw: 4,
          h1_ou_over: 2,
          h1_ou_under: 2,
          h1_oe_odd: 2,
          h1_oe_even: 2,
          ft_hdp_home: 1.87,
          ft_hdp_away: 2.13,
          ft_1x2_home: 2.88,
          ft_1x2_away: 2.13,
          ft_1x2_draw: 5.38,
          ft_ou_over: 3.99,
          ft_ou_under: 1.33,
          ft_oe_odd: 1.99,
          ft_oe_even: 1.99,
        },
        {
          h1_hdp_home: 1.33,
          h1_hdp_away: 4,
          h1_1x2_home: 0,
          h1_1x2_away: 1.33,
          h1_1x2_draw: 4,
          h1_ou_over: 2,
          h1_ou_under: 2,
          h1_oe_odd: 2,
          h1_oe_even: 2,
          ft_hdp_home: 1.78,
          ft_hdp_away: 2.28,
          ft_1x2_home: 5.87,
          ft_1x2_away: 1.52,
          ft_1x2_draw: 5.73,
          ft_ou_over: 4,
          ft_ou_under: 1.33,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
        {
          ft_hdp_home: 1.74,
          ft_hdp_away: 2.34,
          ft_1x2_home: 19.75,
          ft_1x2_away: 1.17,
          ft_1x2_draw: 9.87,
          ft_ou_over: 2,
          ft_ou_under: 2,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
        {
          ft_hdp_home: 1.7,
          ft_hdp_away: 2.42,
          ft_1x2_home: 8.88,
          ft_1x2_away: 1.5,
          ft_1x2_draw: 4.44,
          ft_ou_over: 2,
          ft_ou_under: 2,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
        {
          ft_hdp_home: 1.33,
          ft_hdp_away: 4,
          ft_1x2_home: 0,
          ft_1x2_away: 0,
          ft_1x2_draw: 0,
          ft_ou_over: 2,
          ft_ou_under: 2,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
      ]);
    });
  });

  describe("generateSelectionsForUltraLive", () => {
    it("should generate selections for ultra live with correct structure", () => {
      const odds: Record<string, number>[] = [
        {
          h1_hdp_home: 1.89,
          h1_hdp_away: 2.11,
          h1_1x2_home: 2.92,
          h1_1x2_away: 2.11,
          h1_1x2_draw: 5.38,
          h1_ou_over: 2,
          h1_ou_under: 2,
          h1_oe_odd: 2,
          h1_oe_even: 2,
          ft_hdp_home: 2.02,
          ft_hdp_away: 1.97,
          ft_1x2_home: 2.92,
          ft_1x2_away: 1.97,
          ft_1x2_draw: 6.52,
          ft_ou_over: 4,
          ft_ou_under: 1.33,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
        {
          h1_hdp_home: 1.74,
          h1_hdp_away: 2.34,
          h1_1x2_home: 1.74,
          h1_1x2_away: 4.4,
          h1_1x2_draw: 5.01,
          h1_ou_over: 2,
          h1_ou_under: 2,
          h1_oe_odd: 2,
          h1_oe_even: 2,
          ft_hdp_home: 1.94,
          ft_hdp_away: 2.05,
          ft_1x2_home: 1.94,
          ft_1x2_away: 3.12,
          ft_1x2_draw: 5.99,
          ft_ou_over: 3.99,
          ft_ou_under: 1.33,
          ft_oe_odd: 1.99,
          ft_oe_even: 2,
        },
        {
          h1_hdp_home: 1.7,
          h1_hdp_away: 2.42,
          h1_1x2_home: 2.96,
          h1_1x2_away: 2.42,
          h1_1x2_draw: 4,
          h1_ou_over: 2,
          h1_ou_under: 2,
          h1_oe_odd: 2,
          h1_oe_even: 2,
          ft_hdp_home: 1.87,
          ft_hdp_away: 2.13,
          ft_1x2_home: 2.88,
          ft_1x2_away: 2.13,
          ft_1x2_draw: 5.38,
          ft_ou_over: 3.99,
          ft_ou_under: 1.33,
          ft_oe_odd: 1.99,
          ft_oe_even: 1.99,
        },
        {
          h1_hdp_home: 1.33,
          h1_hdp_away: 4,
          h1_1x2_home: 0,
          h1_1x2_away: 1.33,
          h1_1x2_draw: 4,
          h1_ou_over: 2,
          h1_ou_under: 2,
          h1_oe_odd: 2,
          h1_oe_even: 2,
          ft_hdp_home: 1.78,
          ft_hdp_away: 2.28,
          ft_1x2_home: 5.87,
          ft_1x2_away: 1.52,
          ft_1x2_draw: 5.73,
          ft_ou_over: 4,
          ft_ou_under: 1.33,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
        {
          ft_hdp_home: 1.74,
          ft_hdp_away: 2.34,
          ft_1x2_home: 19.75,
          ft_1x2_away: 1.17,
          ft_1x2_draw: 9.87,
          ft_ou_over: 2,
          ft_ou_under: 2,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
        {
          ft_hdp_home: 1.7,
          ft_hdp_away: 2.42,
          ft_1x2_home: 8.88,
          ft_1x2_away: 1.5,
          ft_1x2_draw: 4.44,
          ft_ou_over: 2,
          ft_ou_under: 2,
          ft_oe_odd: 2,
          ft_oe_even: 2,
        },
        {
          ft_hdp_home: 1.33,
          ft_hdp_away: 4,
          ft_1x2_home: 0,
          ft_1x2_away: 0,
          ft_1x2_draw: 0,
          ft_ou_over: 2,
          ft_ou_under: 2,
          ft_oe_odd: 2,
          ft_oe_even: 2,
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

      const result: RoundResult = [
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

      const selections = oddsGeneratorService.generateSelectionsForUltraLive(odds, matchConfig, result);

      expect(selections).toEqual([
        {
          h1_hdp_home: {
            name: "h1_hdp_home",
            price: 1.89,
            point: 0.5,
            settlementStatus: "P",
          },
          h1_hdp_away: {
            name: "h1_hdp_away",
            price: 2.11,
            point: -0.5,
            settlementStatus: "P",
          },
          h1_1x2_home: {
            name: "h1_1x2_home",
            price: 2.92,
            point: 0,
            settlementStatus: "P",
          },
          h1_1x2_away: {
            name: "h1_1x2_away",
            price: 2.11,
            point: 0,
            settlementStatus: "P",
          },
          h1_1x2_draw: {
            name: "h1_1x2_draw",
            price: 5.38,
            point: 0,
            settlementStatus: "P",
          },
          h1_ou_over: {
            name: "h1_ou_over",
            price: 2,
            point: 3.5,
            settlementStatus: "P",
          },
          h1_ou_under: {
            name: "h1_ou_under",
            price: 2,
            point: 3.5,
            settlementStatus: "P",
          },
          h1_oe_odd: {
            name: "h1_oe_odd",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
          h1_oe_even: {
            name: "h1_oe_even",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 2.02,
            point: 0.5,
            settlementStatus: "P",
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 1.97,
            point: -0.5,
            settlementStatus: "P",
          },
          ft_1x2_home: {
            name: "ft_1x2_home",
            price: 2.92,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_away: {
            name: "ft_1x2_away",
            price: 1.97,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_draw: {
            name: "ft_1x2_draw",
            price: 6.52,
            point: 0,
            settlementStatus: "P",
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 4,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 1.33,
            point: 6.5,
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
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
        },
        {
          h1_hdp_home: {
            name: "h1_hdp_home",
            price: 1.74,
            point: 0.5,
            settlementStatus: "P",
          },
          h1_hdp_away: {
            name: "h1_hdp_away",
            price: 2.34,
            point: -0.5,
            settlementStatus: "P",
          },
          h1_1x2_home: {
            name: "h1_1x2_home",
            price: 1.74,
            point: 0,
            settlementStatus: "P",
          },
          h1_1x2_away: {
            name: "h1_1x2_away",
            price: 4.4,
            point: 0,
            settlementStatus: "P",
          },
          h1_1x2_draw: {
            name: "h1_1x2_draw",
            price: 5.01,
            point: 0,
            settlementStatus: "P",
          },
          h1_ou_over: {
            name: "h1_ou_over",
            price: 2,
            point: 3.5,
            settlementStatus: "P",
          },
          h1_ou_under: {
            name: "h1_ou_under",
            price: 2,
            point: 3.5,
            settlementStatus: "P",
          },
          h1_oe_odd: {
            name: "h1_oe_odd",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
          h1_oe_even: {
            name: "h1_oe_even",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 1.94,
            point: 0.5,
            settlementStatus: "P",
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 2.05,
            point: -0.5,
            settlementStatus: "P",
          },
          ft_1x2_home: {
            name: "ft_1x2_home",
            price: 1.94,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_away: {
            name: "ft_1x2_away",
            price: 3.12,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_draw: {
            name: "ft_1x2_draw",
            price: 5.99,
            point: 0,
            settlementStatus: "P",
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 3.99,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 1.33,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_oe_odd: {
            name: "ft_oe_odd",
            price: 1.99,
            point: 0,
            settlementStatus: "P",
          },
          ft_oe_even: {
            name: "ft_oe_even",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
        },
        {
          h1_hdp_home: {
            name: "h1_hdp_home",
            price: 1.7,
            point: 0.5,
            settlementStatus: "P",
          },
          h1_hdp_away: {
            name: "h1_hdp_away",
            price: 2.42,
            point: -0.5,
            settlementStatus: "P",
          },
          h1_1x2_home: {
            name: "h1_1x2_home",
            price: 2.96,
            point: 0,
            settlementStatus: "P",
          },
          h1_1x2_away: {
            name: "h1_1x2_away",
            price: 2.42,
            point: 0,
            settlementStatus: "P",
          },
          h1_1x2_draw: {
            name: "h1_1x2_draw",
            price: 4,
            point: 0,
            settlementStatus: "P",
          },
          h1_ou_over: {
            name: "h1_ou_over",
            price: 2,
            point: 3.5,
            settlementStatus: "P",
          },
          h1_ou_under: {
            name: "h1_ou_under",
            price: 2,
            point: 3.5,
            settlementStatus: "P",
          },
          h1_oe_odd: {
            name: "h1_oe_odd",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
          h1_oe_even: {
            name: "h1_oe_even",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 1.87,
            point: 0.5,
            settlementStatus: "P",
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 2.13,
            point: -0.5,
            settlementStatus: "P",
          },
          ft_1x2_home: {
            name: "ft_1x2_home",
            price: 2.88,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_away: {
            name: "ft_1x2_away",
            price: 2.13,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_draw: {
            name: "ft_1x2_draw",
            price: 5.38,
            point: 0,
            settlementStatus: "P",
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 3.99,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 1.33,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_oe_odd: {
            name: "ft_oe_odd",
            price: 1.99,
            point: 0,
            settlementStatus: "P",
          },
          ft_oe_even: {
            name: "ft_oe_even",
            price: 1.99,
            point: 0,
            settlementStatus: "P",
          },
        },
        {
          h1_hdp_home: {
            name: "h1_hdp_home",
            price: 1.33,
            point: 0.5,
            settlementStatus: "P",
          },
          h1_hdp_away: {
            name: "h1_hdp_away",
            price: 4,
            point: -0.5,
            settlementStatus: "P",
          },
          h1_1x2_home: {
            name: "h1_1x2_home",
            price: 0,
            point: 0,
            settlementStatus: "P",
          },
          h1_1x2_away: {
            name: "h1_1x2_away",
            price: 1.33,
            point: 0,
            settlementStatus: "P",
          },
          h1_1x2_draw: {
            name: "h1_1x2_draw",
            price: 4,
            point: 0,
            settlementStatus: "P",
          },
          h1_ou_over: {
            name: "h1_ou_over",
            price: 2,
            point: 3.5,
            settlementStatus: "P",
          },
          h1_ou_under: {
            name: "h1_ou_under",
            price: 2,
            point: 3.5,
            settlementStatus: "P",
          },
          h1_oe_odd: {
            name: "h1_oe_odd",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
          h1_oe_even: {
            name: "h1_oe_even",
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 1.78,
            point: 0.5,
            settlementStatus: "P",
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 2.28,
            point: -0.5,
            settlementStatus: "P",
          },
          ft_1x2_home: {
            name: "ft_1x2_home",
            price: 5.87,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_away: {
            name: "ft_1x2_away",
            price: 1.52,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_draw: {
            name: "ft_1x2_draw",
            price: 5.73,
            point: 0,
            settlementStatus: "P",
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 4,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 1.33,
            point: 6.5,
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
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
        },
        {
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 1.74,
            point: 0.5,
            settlementStatus: "P",
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 2.34,
            point: -0.5,
            settlementStatus: "P",
          },
          ft_1x2_home: {
            name: "ft_1x2_home",
            price: 19.75,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_away: {
            name: "ft_1x2_away",
            price: 1.17,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_draw: {
            name: "ft_1x2_draw",
            price: 9.87,
            point: 0,
            settlementStatus: "P",
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 2,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 2,
            point: 6.5,
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
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
        },
        {
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 1.7,
            point: 0.5,
            settlementStatus: "P",
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 2.42,
            point: -0.5,
            settlementStatus: "P",
          },
          ft_1x2_home: {
            name: "ft_1x2_home",
            price: 8.88,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_away: {
            name: "ft_1x2_away",
            price: 1.5,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_draw: {
            name: "ft_1x2_draw",
            price: 4.44,
            point: 0,
            settlementStatus: "P",
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 2,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 2,
            point: 6.5,
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
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
        },
        {
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 1.33,
            point: 0.5,
            settlementStatus: "P",
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 4,
            point: -0.5,
            settlementStatus: "P",
          },
          ft_1x2_home: {
            name: "ft_1x2_home",
            price: 0,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_away: {
            name: "ft_1x2_away",
            price: 0,
            point: 0,
            settlementStatus: "P",
          },
          ft_1x2_draw: {
            name: "ft_1x2_draw",
            price: 0,
            point: 0,
            settlementStatus: "P",
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 2,
            point: 6.5,
            settlementStatus: "P",
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 2,
            point: 6.5,
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
            price: 2,
            point: 0,
            settlementStatus: "P",
          },
        },
      ]);
    });
  });
});
