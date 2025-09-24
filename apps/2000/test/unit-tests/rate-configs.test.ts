import { rateConfigs } from "../../src/game-config";
import { OddsGeneratorService } from "../../../soccer-marble/src/services/odds-generator-service";
import { MatchConfigType } from "../../../soccer-marble/src/types";

describe("rateConfigs", () => {
  describe("awayFavorite", () => {
    it("should always away favorite", () => {
      for (const firstHalfConfig of rateConfigs.awayFavorite) {
        for (const secondHalfConfig of rateConfigs.awayFavorite) {
          const matchConfig = {
            firstHalf: firstHalfConfig,
            secondHalf: secondHalfConfig,
          } as MatchConfigType;

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
          const matchConfig = {
            firstHalf: firstHalfConfig,
            secondHalf: secondHalfConfig,
          } as MatchConfigType;

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
