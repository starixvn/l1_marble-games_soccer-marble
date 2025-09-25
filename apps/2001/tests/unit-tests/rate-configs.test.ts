import { rateConfigs } from "../../src/rate-configs";
import { OddsGeneratorService, MatchConfigType } from "@soccer-marble/soccer-marble-base";

describe("rateConfigs", () => {
  describe("awayFavorite", () => {
    it("should always away favorite", () => {
      for (const firstHalfConfig of rateConfigs.awayFavorite) {
        for (const secondHalfConfig of rateConfigs.awayFavorite) {
          const matchConfig: MatchConfigType = {
            firstHalf: {
              ...firstHalfConfig,
              overUnderValue: 2.5,
              handicapValue: 0.5,
              homeOverUnderValue: 1.5,
              awayOverUnderValue: 1.5,
            },
            secondHalf: {
              ...secondHalfConfig,
              overUnderValue: 2.5,
              handicapValue: 0.5,
              homeOverUnderValue: 1.5,
              awayOverUnderValue: 1.5,
            },
            overUnderValue: 2.5,
            handicapValue: 0.5,
            homeOverUnderValue: 1.5,
            awayOverUnderValue: 1.5,
          };

          const result = new OddsGeneratorService().calculateOddsForRound(matchConfig, "0");

          const firstHalfHandicapValue = result.matchConfig.firstHalf.handicapValue;
          const fulltimeHandicapValue = result.matchConfig.handicapValue;

          expect(firstHalfHandicapValue).toBe(0.5);
          expect(fulltimeHandicapValue).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("homeFavorite", () => {
    it("should always home favorite", () => {
      for (const firstHalfConfig of rateConfigs.homeFavorite) {
        for (const secondHalfConfig of rateConfigs.homeFavorite) {
          const matchConfig: MatchConfigType = {
            firstHalf: {
              ...firstHalfConfig,
              overUnderValue: 2.5,
              handicapValue: -0.5,
              homeOverUnderValue: 1.5,
              awayOverUnderValue: 1.5,
            },
            secondHalf: {
              ...secondHalfConfig,
              overUnderValue: 2.5,
              handicapValue: -0.5,
              homeOverUnderValue: 1.5,
              awayOverUnderValue: 1.5,
            },
            overUnderValue: 2.5,
            handicapValue: -0.5,
            homeOverUnderValue: 1.5,
            awayOverUnderValue: 1.5,
          };

          const result = new OddsGeneratorService().calculateOddsForRound(matchConfig, "0");

          const firstHalfHandicapValue = result.matchConfig.firstHalf.handicapValue;
          const fulltimeHandicapValue = result.matchConfig.handicapValue;

          expect(firstHalfHandicapValue).toBe(-0.5);
          expect(fulltimeHandicapValue).toBeLessThan(0);
        }
      }
    });
  });
});
