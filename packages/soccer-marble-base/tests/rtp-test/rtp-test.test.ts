import { generateResult, generateSettlementResult } from "../../src/helpers/result-helper";
import { secureRandomBool, secureShuffle } from "sc-core-rng";
import { MatchConfigType } from "../../src/types";
import { gameSettings, rateConfigs } from "../../src/game-config";
import { calculateOddsForRound } from "../../src/helpers/odds-helper";

function createNewMatchConfig(): MatchConfigType {
  const isHomeFavorite = secureRandomBool();
  const configs = secureShuffle(isHomeFavorite ? rateConfigs.homeFavorite : rateConfigs.awayFavorite);

  return {
    firstHalf: configs[0],
    secondHalf: configs[1],
  } as MatchConfigType;
}

function generateNewRound() {
  const newRound = {
    matchConfig: createNewMatchConfig(),
  } as any;

  const numberOfVideos = gameSettings.numberOfVideos;

  const result = generateResult({ matchConfig: newRound.matchConfig, numberOfVideos });

  const { odds, matchConfig } = calculateOddsForRound(newRound.matchConfig, result.drawResults[0].result.goalSequence);

  newRound.odds = odds;
  const settlementResult = generateSettlementResult(result, matchConfig);
  newRound.settlementResult = settlementResult;

  return newRound;
}

function calculateRTP(ROUND_IN_BATCH: number) {
  const totalBetFirstHalf = {} as Record<string, number>;
  const totalWinFirstHalf = {} as Record<string, number>;
  const totalBetSecondHalf = {} as Record<string, number>;
  const totalWinSecondHalf = {} as Record<string, number>;

  for (let i = 0; i < ROUND_IN_BATCH; i++) {
    const round = generateNewRound();
    const firstHalfOdds = round.odds[0];
    const secondHalfOdds = round.odds[1];
    const firstHalfSettlementResult = round.settlementResult[0];
    const secondHalfSettlementResult = round.settlementResult[1];

    Object.keys(firstHalfOdds).forEach((key) => {
      if (!totalBetFirstHalf[key]) {
        totalBetFirstHalf[key] = 0;
      }
      if (!totalWinFirstHalf[key]) {
        totalWinFirstHalf[key] = 0;
      }

      if (firstHalfOdds[key] > 1.8) {
        totalBetFirstHalf[key] += 1;
        totalWinFirstHalf[key] += firstHalfSettlementResult[key] === "W" ? firstHalfOdds[key] : 0;
      }
    });

    Object.keys(secondHalfOdds).forEach((key) => {
      if (!totalBetSecondHalf[key]) {
        totalBetSecondHalf[key] = 0;
      }
      if (!totalWinSecondHalf[key]) {
        totalWinSecondHalf[key] = 0;
      }

      if (secondHalfOdds[key] > 1.8) {
        totalBetSecondHalf[key] += 1;
        totalWinSecondHalf[key] += secondHalfSettlementResult[key] === "W" ? secondHalfOdds[key] : 0;
      }
    });
  }

  const rtpFirstHalf = Object.keys(totalBetFirstHalf).reduce((acc, key) => {
    acc[key] = totalWinFirstHalf[key] / totalBetFirstHalf[key];
    return acc;
  }, {} as Record<string, number>);

  const rtpSecondHalf = Object.keys(totalBetSecondHalf).reduce((acc, key) => {
    acc[key] = totalWinSecondHalf[key] / totalBetSecondHalf[key];
    return acc;
  }, {} as Record<string, number>);

  return {
    rtpFirstHalf,
    rtpSecondHalf,
  };
}

// Main execution
describe("RTP Test", () => {
  it("RTP should be near 100%", () => {
    const ROUND_IN_BATCH = 100_000;
    const TOTAL_BATCHES = 1;

    for (let i = 0; i < TOTAL_BATCHES; i++) {
      const rtp = calculateRTP(ROUND_IN_BATCH);
      Object.keys(rtp.rtpFirstHalf).forEach((key) => {
        expect(rtp.rtpFirstHalf[key]).toBeCloseTo(1, 1);
        console.log(key, rtp.rtpFirstHalf[key]);
      });
      Object.keys(rtp.rtpSecondHalf).forEach((key) => {
        expect(rtp.rtpSecondHalf[key]).toBeCloseTo(1, 1);
        console.log(key, rtp.rtpSecondHalf[key]);
      });
    }
  });
});
