import { rateConfigs } from "../../src/rate-configs";
import { OddsGeneratorService } from "@soccer-marble/soccer-marble-base";
import { oddsHelper } from "@soccer-marble/soccer-marble-base";

describe("rateConfigs", () => {
  const oddsGeneratorService = new OddsGeneratorService();
  describe("awayFavorite", () => {
    it("should always away favorite", () => {
      for (const fhRateConfig of rateConfigs.awayFavorite) {
        for (const shRateConfig of rateConfigs.awayFavorite) {
          const ftRateConfig = oddsHelper.mergeArrayOfRates([fhRateConfig, shRateConfig]);

          const fhOddsInfo = oddsGeneratorService.calculateOddsInfo(fhRateConfig.scoreRate);
          const ftOddsInfo = oddsGeneratorService.calculateOddsInfo(ftRateConfig.scoreRate);

          expect(fhOddsInfo.handicapValue).toBe(0.5);
          expect(ftOddsInfo.handicapValue).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("homeFavorite", () => {
    it("should always home favorite", () => {
      for (const fhRateConfig of rateConfigs.homeFavorite) {
        for (const shRateConfig of rateConfigs.homeFavorite) {
          const ftRateConfig = oddsHelper.mergeArrayOfRates([fhRateConfig, shRateConfig]);

          const fhOddsInfo = oddsGeneratorService.calculateOddsInfo(fhRateConfig.scoreRate);
          const ftOddsInfo = oddsGeneratorService.calculateOddsInfo(ftRateConfig.scoreRate);

          expect(fhOddsInfo.handicapValue).toBe(-0.5);
          expect(ftOddsInfo.handicapValue).toBeLessThan(0);
        }
      }
    });
  });
});
