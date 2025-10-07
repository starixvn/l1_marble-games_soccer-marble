import { ContainerRegistry } from "../../src/container-registry";
import { appConfigs } from "../../src/game-config";
import { gameSettings } from "../../src/game-settings";
import { rateConfigs } from "../../src/rate-configs";
import { cryptoHelper } from "@soccer-marble/shared-utils";

const container = new ContainerRegistry(appConfigs, gameSettings, rateConfigs).register();
const roundGeneratorService = container.resolve("roundGeneratorService");

const oddsLimit = 1.2;

function calculateRTP(ROUND_IN_BATCH: number) {
  const totalBetsPerOddsKey = {} as Record<string, number>;
  const totalWinsPerOddsKey = {} as Record<string, number>;
  let totalBetsFirstHalf = 0;
  let totalWinsFirstHalf = 0;
  let totalBetsSecondHalf = 0;
  let totalWinsSecondHalf = 0;
  let totalAllBets = 0;
  let totalAllWins = 0;

  for (let i = 0; i < ROUND_IN_BATCH; i++) {
    const round = roundGeneratorService.generateNewRound(i);
    const eventDetailInfos = round.matchConfig.eventDetailInfos;
    const allEventDetailsOdds = round.odds;
    const allEventDetailsSettlementResults = cryptoHelper.decrypt(round.encryptedSettlementResult);

    allEventDetailsOdds.forEach((eventDetailOdds, index) => {
      const eventDetailSettlementResult = allEventDetailsSettlementResults[index];
      const eventDetailInfo = eventDetailInfos[index];

      Object.keys(eventDetailOdds).forEach((oddsKey) => {
        if (!totalBetsPerOddsKey[oddsKey]) {
          totalBetsPerOddsKey[oddsKey] = 0;
        }
        if (!totalWinsPerOddsKey[oddsKey]) {
          totalWinsPerOddsKey[oddsKey] = 0;
        }

        const betAmount = 1;
        const winAmount = eventDetailSettlementResult[oddsKey] === "W" ? eventDetailOdds[oddsKey] * betAmount : 0;

        if (eventDetailOdds[oddsKey] > oddsLimit) {
          totalBetsPerOddsKey[oddsKey] += betAmount;
          totalWinsPerOddsKey[oddsKey] += winAmount;

          if (eventDetailInfo.phase === 0) {
            totalBetsFirstHalf += betAmount;
            totalWinsFirstHalf += winAmount;
          } else {
            totalBetsSecondHalf += betAmount;
            totalWinsSecondHalf += winAmount;
          }

          totalAllBets += betAmount;
          totalAllWins += winAmount;
        }
      });
    });
  }

  const rtpPerOddsKey = Object.keys(totalBetsPerOddsKey).reduce((acc, key) => {
    acc[key] = totalWinsPerOddsKey[key] / totalBetsPerOddsKey[key];
    return acc;
  }, {} as Record<string, number>);

  const rtpFirstHalf = totalWinsFirstHalf / totalBetsFirstHalf;
  const rtpSecondHalf = totalWinsSecondHalf / totalBetsSecondHalf;
  const rtpAll = totalAllWins / totalAllBets;

  return {
    rtpPerOddsKey,
    rtpFirstHalf,
    rtpSecondHalf,
    rtpAll,
  };
}
// Main execution
describe("RTP Test", () => {
  it("RTP should be near 100%", () => {
    const ROUND_IN_BATCH = 100_000;
    const TOTAL_BATCHES = 1;

    for (let i = 0; i < TOTAL_BATCHES; i++) {
      const rtp = calculateRTP(ROUND_IN_BATCH);
      Object.keys(rtp.rtpPerOddsKey).forEach((key) => {
        expect(rtp.rtpPerOddsKey[key]).toBeCloseTo(1, 1);
        console.log(key, rtp.rtpPerOddsKey[key]);
      });

      expect(rtp.rtpFirstHalf).toBeCloseTo(1, 1);
      expect(rtp.rtpSecondHalf).toBeCloseTo(1, 1);
      expect(rtp.rtpAll).toBeCloseTo(1, 1);
    }
  });
});
