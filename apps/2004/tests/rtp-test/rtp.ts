import fs from "fs/promises"; // Using promises version for better async handling
import path from "path";

import { cryptoHelper } from "@soccer-marble/shared-utils";
import { ContainerRegistry } from "@soccer-marble/soccer-marble-live";
import appConfigs from "../../src/game-config.json";
import gameSettings from "../../src/game-settings.json";
import rateConfigs from "../../src/rate-configs.json";

const container = new ContainerRegistry(appConfigs, gameSettings, rateConfigs).register();
const roundGeneratorService = container.resolve("roundGeneratorService");

const oddsLimit = 1.2;

// Helper functions
async function saveData(filename: string, data: any): Promise<void> {
  try {
    const dirname = path.dirname(filename);
    const filePath = path.join(dirname, "tests", "rtp-test", filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Data saved as ${filename}`);
  } catch (err) {
    console.error("Error writing data:", err);
    throw err;
  }
}

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
async function main() {
  console.time("RTP");

  const totalRtp = [] as any[];
  const ROUND_IN_BATCH = 100_000;
  const TOTAL_BATCHES = 1;

  for (let i = 0; i < TOTAL_BATCHES; i++) {
    const rtp = calculateRTP(ROUND_IN_BATCH);
    totalRtp.push(rtp);
  }

  await saveData("rtp_real.json", totalRtp);

  console.timeEnd("RTP");
}

// Execute and handle errors
main().catch(console.error);
