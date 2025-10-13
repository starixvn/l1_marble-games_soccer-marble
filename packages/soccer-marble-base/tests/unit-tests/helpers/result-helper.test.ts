import { resultHelper } from "../../../src/helpers";
import crypto from "crypto";
import { SettlementStatus } from "../../../src/types";

describe("ResultHelper tests", () => {
  describe("getScoreFromScoreRate", () => {
    it("should return one of the valid scores", () => {
      // Arrange
      const scoreRate = {
        "1-0": 0.1285,
        "0-1": 0.1285,
        "1-1": 0.18,
        "2-0": 0.0834,
        "0-2": 0.0834,
        "2-1": 0.0729,
        "1-2": 0.0729,
        "3-0": 0.0416,
        "0-3": 0.0416,
        "2-2": 0.0628,
        "3-1": 0.0418,
        "1-3": 0.0418,
        "4-0": 0.0104,
        "0-4": 0.0104,
      };

      // Act
      const result = resultHelper.getScoreFromScoreRate(scoreRate);

      // Assert
      expect(Object.keys(scoreRate)).toContain(result);
    });
  });

  describe("generateVideoName", () => {
    it("should return a valid video name", () => {
      // Arrange
      const result = "HAA";

      const videoName = resultHelper.generateVideoName(result, 1);
      const expectedVideoname = crypto.createHash("sha256").update(`${result}-0`).digest("hex");

      // Assert
      expect(videoName).toBe(expectedVideoname);
    });
  });

  describe("getHandicapResult", () => {
    it("should return home win for handicap", () => {
      const result = resultHelper.getHandicapResult(2, 1, -0.5);

      expect(result.hdpHome).toBe(SettlementStatus.WIN);
      expect(result.hdpAway).toBe(SettlementStatus.LOSE);
    });

    it("should return away win for handicap", () => {
      const result = resultHelper.getHandicapResult(1, 2, 0.5);

      expect(result.hdpHome).toBe(SettlementStatus.LOSE);
      expect(result.hdpAway).toBe(SettlementStatus.WIN);
    });

    it("should return draw for handicap", () => {
      const result = resultHelper.getHandicapResult(1, 1, 0);

      expect(result.hdpHome).toBe(SettlementStatus.DRAW);
      expect(result.hdpAway).toBe(SettlementStatus.DRAW);
    });
  });

  describe("get1X2Result", () => {
    it("should return home win", () => {
      const result = resultHelper.get1X2Result(2, 1);

      expect(result.home).toBe(SettlementStatus.WIN);
      expect(result.away).toBe(SettlementStatus.LOSE);
      expect(result.draw).toBe(SettlementStatus.LOSE);
    });

    it("should return away win", () => {
      const result = resultHelper.get1X2Result(1, 2);

      expect(result.home).toBe(SettlementStatus.LOSE);
      expect(result.away).toBe(SettlementStatus.WIN);
      expect(result.draw).toBe(SettlementStatus.LOSE);
    });

    it("should return draw", () => {
      const result = resultHelper.get1X2Result(1, 1);

      expect(result.home).toBe(SettlementStatus.LOSE);
      expect(result.away).toBe(SettlementStatus.LOSE);
      expect(result.draw).toBe(SettlementStatus.WIN);
    });
  });

  describe("getOverUnderResult", () => {
    it("should return over win", () => {
      const result = resultHelper.getOverUnderResult(3, 2.5);

      expect(result.over).toBe(SettlementStatus.WIN);
      expect(result.under).toBe(SettlementStatus.LOSE);
    });

    it("should return under win", () => {
      const result = resultHelper.getOverUnderResult(2, 2.5);

      expect(result.over).toBe(SettlementStatus.LOSE);
      expect(result.under).toBe(SettlementStatus.WIN);
    });

    it("should return draw for exact match", () => {
      const result = resultHelper.getOverUnderResult(2, 2);

      expect(result.over).toBe(SettlementStatus.DRAW);
      expect(result.under).toBe(SettlementStatus.DRAW);
    });
  });

  describe("getOddEvenResult", () => {
    it("should return odd win", () => {
      const result = resultHelper.getOddEvenResult(3);

      expect(result.odd).toBe(SettlementStatus.WIN);
      expect(result.even).toBe(SettlementStatus.LOSE);
    });

    it("should return even win", () => {
      const result = resultHelper.getOddEvenResult(4);

      expect(result.odd).toBe(SettlementStatus.LOSE);
      expect(result.even).toBe(SettlementStatus.WIN);
    });

    it("should return even win for zero", () => {
      const result = resultHelper.getOddEvenResult(0);

      expect(result.odd).toBe(SettlementStatus.LOSE);
      expect(result.even).toBe(SettlementStatus.WIN);
    });
  });

  describe("getTeamOverUnderResult", () => {
    it("should return home over and away under", () => {
      const result = resultHelper.getTeamOverUnderResult(2, 1, 1.5, 1.5);

      expect(result.homeOver).toBe(SettlementStatus.WIN);
      expect(result.homeUnder).toBe(SettlementStatus.LOSE);
      expect(result.awayOver).toBe(SettlementStatus.LOSE);
      expect(result.awayUnder).toBe(SettlementStatus.WIN);
    });

    it("should return home under and away over", () => {
      const result = resultHelper.getTeamOverUnderResult(1, 2, 1.5, 1.5);

      expect(result.homeOver).toBe(SettlementStatus.LOSE);
      expect(result.homeUnder).toBe(SettlementStatus.WIN);
      expect(result.awayOver).toBe(SettlementStatus.WIN);
      expect(result.awayUnder).toBe(SettlementStatus.LOSE);
    });

    it("should return draw for exact matches", () => {
      const result = resultHelper.getTeamOverUnderResult(1, 1, 1, 1);

      expect(result.homeOver).toBe(SettlementStatus.DRAW);
      expect(result.homeUnder).toBe(SettlementStatus.DRAW);
      expect(result.awayOver).toBe(SettlementStatus.DRAW);
      expect(result.awayUnder).toBe(SettlementStatus.DRAW);
    });
  });
});
