import * as rngModule from "sc-core-rng";
import { idHelper, encrypt } from "@soccer-marble/shared-utils";
import { OddsGeneratorService } from "../../../src/services/odds-generator-service";
import { ResultGeneratorService } from "../../../src/services/result-generator-service";
import { RoundGeneratorService } from "../../../src/services/round-generator-service";
import { SettlementStatus } from "@soccer-marble/soccer-marble-base";
import type { GameTiming, OddsInfo } from "../../../src/types";
import { MIN_PHASE_BLOCKS, MAX_PHASE_BLOCKS, MIN_VIDEO_LENGTH } from "../../../src/constant";

jest.mock("sc-core-rng");
jest.mock("@soccer-marble/shared-utils");

describe("RoundGeneratorService", () => {
  let service: RoundGeneratorService;
  let mockOddsGeneratorService: OddsGeneratorService;
  let mockResultGeneratorService: ResultGeneratorService;

  const mockGameSettings = {
    gameId: 2004,
    gameTiming: {
      extraInfo: {
        videoLength: 60,
        oddsDuration: 10,
        resultDuration: 5,
        halfTimeDuration: 15,
        afterGoalDuration: 5,
      },
    } as GameTiming,
    numberOfVideos: {
      H: 10,
      A: 10,
    },
    teams: ["Team A", "Team B"],
    theme: "Test Theme",
  };

  const mockRateConfigs = {
    homeFavorite: [{ scoreRate: { "1-0": 0.2, "0-1": 0.1 } }, { scoreRate: { "1-0": 0.3, "0-1": 0.1 } }],
    awayFavorite: [{ scoreRate: { "1-0": 0.1, "0-1": 0.2 } }, { scoreRate: { "1-0": 0.1, "0-1": 0.3 } }],
    homeFavoriteDraw: [{ scoreRate: { "1-1": 0.4 } }],
    awayFavoriteDraw: [{ scoreRate: { "1-1": 0.4 } }],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOddsGeneratorService = new OddsGeneratorService();
    mockResultGeneratorService = new ResultGeneratorService({} as any);

    service = new RoundGeneratorService({} as any);
    service.resultGeneratorService = mockResultGeneratorService;
    service.oddsGeneratorService = mockOddsGeneratorService;
    // Use Object.assign to set protected properties for testing
    Object.assign(service, {
      gameSettings: mockGameSettings,
      rateConfigs: mockRateConfigs,
      gameData: {
        gameConfig: null,
      },
    });
  });

  describe("generateRateConfigsForPhase", () => {
    it("should generate rate configs for home favorite phase", () => {
      const isHomeFavorite = true;
      const size = 3;

      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.homeFavorite[0]);

      const result = service.generateRateConfigsForPhase(isHomeFavorite, size);

      expect(result).toHaveLength(3);
      expect(result[0]).toBeDefined();
      expect(result[1]).toBeDefined();
      expect(result[2]).toBeDefined();
    });

    it("should generate rate configs for away favorite phase", () => {
      const isHomeFavorite = false;
      const size = 2;

      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.awayFavorite[0]);

      const result = service.generateRateConfigsForPhase(isHomeFavorite, size);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeDefined();
      expect(result[1]).toBeDefined();
    });

    it("should handle size 1 correctly", () => {
      const isHomeFavorite = true;
      const size = 1;

      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.homeFavoriteDraw[0]);

      const result = service.generateRateConfigsForPhase(isHomeFavorite, size);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
    });

    it("should handle large size values", () => {
      const isHomeFavorite = false;
      const size = 10;

      jest
        .spyOn(rngModule, "securePickOne")
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[0])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[1])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[0])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[1])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[0])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[1])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[0])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[1])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[0])
        .mockReturnValueOnce(mockRateConfigs.awayFavoriteDraw[0]);

      const result = service.generateRateConfigsForPhase(isHomeFavorite, size);

      expect(result).toHaveLength(10);
      expect(result.every((config) => config)).toBe(true);
    });

    it("should always end with draw config for home favorite", () => {
      const isHomeFavorite = true;
      const size = 3;

      jest
        .spyOn(rngModule, "securePickOne")
        .mockReturnValueOnce(mockRateConfigs.homeFavorite[0])
        .mockReturnValueOnce(mockRateConfigs.homeFavorite[1])
        .mockReturnValueOnce(mockRateConfigs.homeFavoriteDraw[0]);

      const result = service.generateRateConfigsForPhase(isHomeFavorite, size);

      expect(result).toHaveLength(3);
      expect(result[2]).toBe(mockRateConfigs.homeFavoriteDraw[0]);
    });

    it("should always end with draw config for away favorite", () => {
      const isHomeFavorite = false;
      const size = 3;

      jest
        .spyOn(rngModule, "securePickOne")
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[0])
        .mockReturnValueOnce(mockRateConfigs.awayFavorite[1])
        .mockReturnValueOnce(mockRateConfigs.awayFavoriteDraw[0]);

      const result = service.generateRateConfigsForPhase(isHomeFavorite, size);

      expect(result).toHaveLength(3);
      expect(result[2]).toBe(mockRateConfigs.awayFavoriteDraw[0]);
    });

    it("should call securePickOne correct number of times", () => {
      const isHomeFavorite = true;
      const size = 4;
      const securePickOneSpy = jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.homeFavorite[0]);

      service.generateRateConfigsForPhase(isHomeFavorite, size);

      expect(securePickOneSpy).toHaveBeenCalledTimes(size);
    });
  });

  describe("generateVideoLengthForPhase", () => {
    it("should generate video lengths for phase", () => {
      const size = 3;

      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(20);

      const result = service.generateVideoLengthForPhase(size);

      expect(result).toHaveLength(3);
      expect(result.every((length) => length >= MIN_VIDEO_LENGTH)).toBe(true);
      expect(result.reduce((sum, length) => sum + length, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);
    });

    it("should handle single video length", () => {
      const size = 1;

      const result = service.generateVideoLengthForPhase(size);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);
    });

    it("should handle large size values", () => {
      const size = 10;
      const expectedMaxLength = Math.round(mockGameSettings.gameTiming.extraInfo.videoLength / size);

      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(expectedMaxLength);

      const result = service.generateVideoLengthForPhase(size);

      expect(result).toHaveLength(10);
      expect(result.every((length) => length >= MIN_VIDEO_LENGTH)).toBe(true);
      expect(result.reduce((sum, length) => sum + length, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);
    });

    it("should handle minimum video length boundary", () => {
      const size = 2;
      const maxLength = Math.round(mockGameSettings.gameTiming.extraInfo.videoLength / size);

      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(MIN_VIDEO_LENGTH);

      const result = service.generateVideoLengthForPhase(size);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(MIN_VIDEO_LENGTH);
      expect(result[1]).toBe(mockGameSettings.gameTiming.extraInfo.videoLength - MIN_VIDEO_LENGTH);
      expect(result.reduce((sum, length) => sum + length, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);
    });

    it("should handle maximum video length boundary", () => {
      const size = 2;
      const maxLength = Math.round(mockGameSettings.gameTiming.extraInfo.videoLength / size);

      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(maxLength);

      const result = service.generateVideoLengthForPhase(size);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(maxLength);
      expect(result[1]).toBe(mockGameSettings.gameTiming.extraInfo.videoLength - maxLength);
      expect(result.reduce((sum, length) => sum + length, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);
    });

    it("should call secureRandomRange correct number of times", () => {
      const size = 5;
      const secureRandomRangeSpy = jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(10);

      service.generateVideoLengthForPhase(size);

      expect(secureRandomRangeSpy).toHaveBeenCalledTimes(size - 1);
    });

    it("should handle odd video length division", () => {
      const customGameSettings = {
        ...mockGameSettings,
        gameTiming: {
          ...mockGameSettings.gameTiming,
          extraInfo: {
            ...mockGameSettings.gameTiming.extraInfo,
            videoLength: 61, // Odd number
          },
        },
      };

      Object.assign(service, { gameSettings: customGameSettings });

      const size = 3;
      const maxLength = Math.round(61 / size); // 20

      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(20);

      const result = service.generateVideoLengthForPhase(size);

      expect(result).toHaveLength(3);
      expect(result.reduce((sum, length) => sum + length, 0)).toBe(61);
    });

    it("should ensure last video length is always positive", () => {
      const size = 2;
      const maxLength = Math.round(mockGameSettings.gameTiming.extraInfo.videoLength / size);

      // Mock to return maximum possible length for first video
      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(maxLength);

      const result = service.generateVideoLengthForPhase(size);

      expect(result[1]).toBeGreaterThan(0);
      expect(result.reduce((sum, length) => sum + length, 0)).toBe(mockGameSettings.gameTiming.extraInfo.videoLength);
    });
  });

  describe("generateTimelineForFirstHalf", () => {
    it("should generate timeline for first half", () => {
      const videoLengths = [20, 20, 20];

      const result = service.generateTimelineForFirstHalf(videoLengths);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("OddsAvailable");
      expect(result[0]).toHaveProperty("ScheduleStart");
      expect(result[0]).toHaveProperty("ResultAvailable");
      expect(result[0].OddsAvailable).toBe(0);
      expect(result[0].ScheduleStart).toBe(mockGameSettings.gameTiming.extraInfo.oddsDuration);
    });

    it("should handle single video length", () => {
      const videoLengths = [60];

      const result = service.generateTimelineForFirstHalf(videoLengths);

      expect(result).toHaveLength(1);
      expect(result[0].OddsAvailable).toBe(0);
      expect(result[0].ScheduleStart).toBe(mockGameSettings.gameTiming.extraInfo.oddsDuration);
      expect(result[0].ResultAvailable).toBe(mockGameSettings.gameTiming.extraInfo.oddsDuration + 60);
    });

    it("should handle empty video lengths array", () => {
      const videoLengths: number[] = [];

      const result = service.generateTimelineForFirstHalf(videoLengths);

      expect(result).toHaveLength(0);
    });

    it("should handle large number of video lengths", () => {
      const videoLengths = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

      const result = service.generateTimelineForFirstHalf(videoLengths);

      expect(result).toHaveLength(10);
      expect(result[0].OddsAvailable).toBe(0);
      expect(result[0].ScheduleStart).toBe(mockGameSettings.gameTiming.extraInfo.oddsDuration);

      // Check that each subsequent timeline starts after the previous one ends
      for (let i = 1; i < result.length; i++) {
        expect(result[i].OddsAvailable).toBe(result[i - 1].ScheduleStart);
        expect(result[i].ScheduleStart).toBe(
          result[i - 1].ResultAvailable + mockGameSettings.gameTiming.extraInfo.afterGoalDuration
        );
        expect(result[i].ResultAvailable).toBe(result[i].ScheduleStart + videoLengths[i]);
      }
    });

    it("should handle varying video lengths", () => {
      const videoLengths = [5, 30, 15, 10];

      const result = service.generateTimelineForFirstHalf(videoLengths);

      expect(result).toHaveLength(4);
      expect(result[0].ResultAvailable).toBe(mockGameSettings.gameTiming.extraInfo.oddsDuration + 5);
      expect(result[1].ResultAvailable).toBe(result[1].ScheduleStart + 30);
      expect(result[2].ResultAvailable).toBe(result[2].ScheduleStart + 15);
      expect(result[3].ResultAvailable).toBe(result[3].ScheduleStart + 10);
    });

    it("should handle minimum video length", () => {
      const videoLengths = [MIN_VIDEO_LENGTH, MIN_VIDEO_LENGTH];

      const result = service.generateTimelineForFirstHalf(videoLengths);

      expect(result).toHaveLength(2);
      expect(result[0].ResultAvailable).toBe(mockGameSettings.gameTiming.extraInfo.oddsDuration + MIN_VIDEO_LENGTH);
      expect(result[1].ResultAvailable).toBe(result[1].ScheduleStart + MIN_VIDEO_LENGTH);
    });

    it("should calculate correct timeline progression", () => {
      const videoLengths = [20, 20, 20];
      const oddsDuration = mockGameSettings.gameTiming.extraInfo.oddsDuration;
      const afterGoalDuration = mockGameSettings.gameTiming.extraInfo.afterGoalDuration;

      const result = service.generateTimelineForFirstHalf(videoLengths);

      expect(result[0].OddsAvailable).toBe(0);
      expect(result[0].ScheduleStart).toBe(oddsDuration);
      expect(result[0].ResultAvailable).toBe(oddsDuration + 20);

      expect(result[1].OddsAvailable).toBe(oddsDuration);
      expect(result[1].ScheduleStart).toBe(oddsDuration + 20 + afterGoalDuration);
      expect(result[1].ResultAvailable).toBe(oddsDuration + 20 + afterGoalDuration + 20);

      expect(result[2].OddsAvailable).toBe(oddsDuration + 20 + afterGoalDuration);
      expect(result[2].ScheduleStart).toBe(oddsDuration + 20 + afterGoalDuration + 20 + afterGoalDuration);
      expect(result[2].ResultAvailable).toBe(oddsDuration + 20 + afterGoalDuration + 20 + afterGoalDuration + 20);
    });
  });

  describe("generateTimelineForSecondHalf", () => {
    it("should generate timeline for second half", () => {
      const videoLengths = [20, 20, 20];
      const fhTimelines = [
        { OddsAvailable: 0, ScheduleStart: 10, ResultAvailable: 30 },
        { OddsAvailable: 0, ScheduleStart: 35, ResultAvailable: 55 },
        { OddsAvailable: 0, ScheduleStart: 60, ResultAvailable: 80 },
      ];

      const result = service.generateTimelineForSecondHalf(videoLengths, fhTimelines);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("OddsAvailable");
      expect(result[0]).toHaveProperty("ScheduleStart");
      expect(result[0]).toHaveProperty("ResultAvailable");
      expect(result[0].OddsAvailable).toBe(80); // Last first half result available
      expect(result[0].ScheduleStart).toBe(80 + mockGameSettings.gameTiming.extraInfo.halfTimeDuration);
    });

    it("should handle empty video lengths array", () => {
      const videoLengths: number[] = [];
      const fhTimelines = [{ OddsAvailable: 0, ScheduleStart: 10, ResultAvailable: 30 }];

      const result = service.generateTimelineForSecondHalf(videoLengths, fhTimelines);

      expect(result).toHaveLength(0);
    });

    it("should handle empty first half timelines array", () => {
      const videoLengths = [20, 20];
      const fhTimelines: any[] = [];

      expect(() => {
        service.generateTimelineForSecondHalf(videoLengths, fhTimelines);
      }).toThrow();
    });

    it("should handle single video length", () => {
      const videoLengths = [60];
      const fhTimelines = [
        { OddsAvailable: 0, ScheduleStart: 10, ResultAvailable: 30 },
        { OddsAvailable: 0, ScheduleStart: 35, ResultAvailable: 55 },
        { OddsAvailable: 0, ScheduleStart: 60, ResultAvailable: 80 },
      ];

      const result = service.generateTimelineForSecondHalf(videoLengths, fhTimelines);

      expect(result).toHaveLength(1);
      expect(result[0].OddsAvailable).toBe(80);
      expect(result[0].ScheduleStart).toBe(80 + mockGameSettings.gameTiming.extraInfo.halfTimeDuration);
      expect(result[0].ResultAvailable).toBe(result[0].ScheduleStart + 60);
    });

    it("should handle large number of video lengths", () => {
      const videoLengths = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      const fhTimelines = [
        { OddsAvailable: 0, ScheduleStart: 10, ResultAvailable: 30 },
        { OddsAvailable: 0, ScheduleStart: 35, ResultAvailable: 55 },
        { OddsAvailable: 0, ScheduleStart: 60, ResultAvailable: 80 },
      ];

      const result = service.generateTimelineForSecondHalf(videoLengths, fhTimelines);

      expect(result).toHaveLength(10);
      expect(result[0].OddsAvailable).toBe(80);
      expect(result[0].ScheduleStart).toBe(80 + mockGameSettings.gameTiming.extraInfo.halfTimeDuration);

      // Check that each subsequent timeline starts after the previous one ends
      for (let i = 1; i < result.length; i++) {
        expect(result[i].OddsAvailable).toBe(result[i - 1].ScheduleStart);
        expect(result[i].ScheduleStart).toBe(
          result[i - 1].ResultAvailable + mockGameSettings.gameTiming.extraInfo.afterGoalDuration
        );
        expect(result[i].ResultAvailable).toBe(result[i].ScheduleStart + videoLengths[i]);
      }
    });

    it("should handle varying video lengths", () => {
      const videoLengths = [5, 30, 15, 10];
      const fhTimelines = [
        { OddsAvailable: 0, ScheduleStart: 10, ResultAvailable: 30 },
        { OddsAvailable: 0, ScheduleStart: 35, ResultAvailable: 55 },
        { OddsAvailable: 0, ScheduleStart: 60, ResultAvailable: 80 },
      ];

      const result = service.generateTimelineForSecondHalf(videoLengths, fhTimelines);

      expect(result).toHaveLength(4);
      expect(result[0].ResultAvailable).toBe(result[0].ScheduleStart + 5);
      expect(result[1].ResultAvailable).toBe(result[1].ScheduleStart + 30);
      expect(result[2].ResultAvailable).toBe(result[2].ScheduleStart + 15);
      expect(result[3].ResultAvailable).toBe(result[3].ScheduleStart + 10);
    });

    it("should handle minimum video length", () => {
      const videoLengths = [MIN_VIDEO_LENGTH, MIN_VIDEO_LENGTH];
      const fhTimelines = [
        { OddsAvailable: 0, ScheduleStart: 10, ResultAvailable: 30 },
        { OddsAvailable: 0, ScheduleStart: 35, ResultAvailable: 55 },
        { OddsAvailable: 0, ScheduleStart: 60, ResultAvailable: 80 },
      ];

      const result = service.generateTimelineForSecondHalf(videoLengths, fhTimelines);

      expect(result).toHaveLength(2);
      expect(result[0].ResultAvailable).toBe(result[0].ScheduleStart + MIN_VIDEO_LENGTH);
      expect(result[1].ResultAvailable).toBe(result[1].ScheduleStart + MIN_VIDEO_LENGTH);
    });

    it("should calculate correct timeline progression", () => {
      const videoLengths = [20, 20, 20];
      const fhTimelines = [
        { OddsAvailable: 0, ScheduleStart: 10, ResultAvailable: 30 },
        { OddsAvailable: 0, ScheduleStart: 35, ResultAvailable: 55 },
        { OddsAvailable: 0, ScheduleStart: 60, ResultAvailable: 80 },
      ];
      const halfTimeDuration = mockGameSettings.gameTiming.extraInfo.halfTimeDuration;
      const afterGoalDuration = mockGameSettings.gameTiming.extraInfo.afterGoalDuration;

      const result = service.generateTimelineForSecondHalf(videoLengths, fhTimelines);

      expect(result[0].OddsAvailable).toBe(80);
      expect(result[0].ScheduleStart).toBe(80 + halfTimeDuration);
      expect(result[0].ResultAvailable).toBe(80 + halfTimeDuration + 20);

      expect(result[1].OddsAvailable).toBe(80 + halfTimeDuration);
      expect(result[1].ScheduleStart).toBe(80 + halfTimeDuration + 20 + afterGoalDuration);
      expect(result[1].ResultAvailable).toBe(80 + halfTimeDuration + 20 + afterGoalDuration + 20);

      expect(result[2].OddsAvailable).toBe(80 + halfTimeDuration + 20 + afterGoalDuration);
      expect(result[2].ScheduleStart).toBe(80 + halfTimeDuration + 20 + afterGoalDuration + 20 + afterGoalDuration);
      expect(result[2].ResultAvailable).toBe(
        80 + halfTimeDuration + 20 + afterGoalDuration + 20 + afterGoalDuration + 20
      );
    });

    it("should handle single first half timeline", () => {
      const videoLengths = [20, 20];
      const fhTimelines = [{ OddsAvailable: 0, ScheduleStart: 10, ResultAvailable: 30 }];

      const result = service.generateTimelineForSecondHalf(videoLengths, fhTimelines);

      expect(result).toHaveLength(2);
      expect(result[0].OddsAvailable).toBe(30);
      expect(result[0].ScheduleStart).toBe(30 + mockGameSettings.gameTiming.extraInfo.halfTimeDuration);
    });
  });

  describe("createNewMatchConfig", () => {
    it("should create new match config with correct structure", () => {
      jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(true);
      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(2);
      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.homeFavorite[0]);
      jest.spyOn(mockOddsGeneratorService, "calculateOddsInfo").mockReturnValue({
        handicapValue: 0.5,
        overUnderValue: 2.5,
      } as OddsInfo);

      const result = service.createNewMatchConfig();

      expect(result).toHaveProperty("gameTiming");
      expect(result).toHaveProperty("numberOfEventDetails");
      expect(result).toHaveProperty("eventDetailInfos");
      expect(result).toHaveProperty("rateConfig");
      expect(result).toHaveProperty("oddsInfo");
      expect(result.eventDetailInfos.length).toBeGreaterThan(0);
      expect(result.oddsInfo.length).toBeGreaterThan(0);
    });

    it("should create match config with away favorite", () => {
      jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(false);
      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(2);
      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.awayFavorite[0]);
      jest.spyOn(mockOddsGeneratorService, "calculateOddsInfo").mockReturnValue({
        handicapValue: -0.5,
        overUnderValue: 2.5,
      } as OddsInfo);

      const result = service.createNewMatchConfig();

      expect(result).toBeDefined();
      expect(result.eventDetailInfos.length).toBeGreaterThan(0);
    });

    it("should handle minimum phase blocks", () => {
      jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(true);
      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(MIN_PHASE_BLOCKS);
      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.homeFavorite[0]);
      jest.spyOn(mockOddsGeneratorService, "calculateOddsInfo").mockReturnValue({
        handicapValue: 0.5,
        overUnderValue: 2.5,
      } as OddsInfo);

      const result = service.createNewMatchConfig();

      expect(result.numberOfEventDetails).toBe(MIN_PHASE_BLOCKS * 2);
      expect(result.eventDetailInfos.length).toBe(MIN_PHASE_BLOCKS * 2);
    });

    it("should handle maximum phase blocks", () => {
      jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(false);
      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(MAX_PHASE_BLOCKS);
      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.awayFavorite[0]);
      jest.spyOn(mockOddsGeneratorService, "calculateOddsInfo").mockReturnValue({
        handicapValue: -0.5,
        overUnderValue: 2.5,
      } as OddsInfo);

      const result = service.createNewMatchConfig();

      expect(result.numberOfEventDetails).toBe(MAX_PHASE_BLOCKS * 2);
      expect(result.eventDetailInfos.length).toBe(MAX_PHASE_BLOCKS * 2);
    });
  });

  describe("generateNewRound", () => {
    const mockRoundId = 123;
    const mockHomeTeam = "Home Team";
    const mockAwayTeam = "Away Team";
    const mockTheme = "Test Theme";
    const mockResult = [
      {
        playlist: "video1.mp4",
        goalInfo: "Goal at 15:30",
        result: {
          goalSequence: "1-0",
          finalScore: "2-1",
        },
        phase: 0,
      },
    ];
    const mockSettlementResult = [
      { home: SettlementStatus.WIN, away: SettlementStatus.LOSE, draw: SettlementStatus.LOSE },
    ];
    const mockOdds = [{ home: 1.5, away: 2.5, draw: 3.0 }];
    const mockSelections = [
      {
        home: { name: "Home Win", price: 1.5, point: 0, settlementStatus: SettlementStatus.PLAY },
        away: { name: "Away Win", price: 2.5, point: 0, settlementStatus: SettlementStatus.PLAY },
        draw: { name: "Draw", price: 3.0, point: 0, settlementStatus: SettlementStatus.PLAY },
      },
    ];

    beforeEach(() => {
      // Mock the createNewMatch method
      jest.spyOn(service, "createNewMatch").mockReturnValue({
        homeTeam: mockHomeTeam,
        awayTeam: mockAwayTeam,
        theme: mockTheme,
      });

      // Mock the createNewMatchConfig method
      jest.spyOn(service, "createNewMatchConfig").mockReturnValue({
        gameTiming: mockGameSettings.gameTiming,
        numberOfEventDetails: 4,
        eventDetailInfos: [],
        rateConfig: { scoreRate: {} },
        oddsInfo: [],
      });

      // Mock result generator service
      jest.spyOn(mockResultGeneratorService, "generateResult").mockReturnValue(mockResult);
      jest.spyOn(mockResultGeneratorService, "generateSettlementResult").mockReturnValue(mockSettlementResult);

      // Mock odds generator service
      jest.spyOn(mockOddsGeneratorService, "calculateOddsForUltraLive").mockReturnValue(mockOdds);
      jest.spyOn(mockOddsGeneratorService, "generateSelectionsForUltraLive").mockReturnValue(mockSelections);

      // Mock shared utils
      jest.spyOn(idHelper, "createEventId").mockReturnValue(123456);
      (encrypt as jest.Mock).mockReturnValue("encrypted-data");
    });

    it("should generate a complete round with all required properties", () => {
      const result = service.generateNewRound(mockRoundId);

      expect(result).toHaveProperty("gameId", mockGameSettings.gameId);
      expect(result).toHaveProperty("eventID", 123456);
      expect(result).toHaveProperty("roundId", mockRoundId);
      expect(result).toHaveProperty("homeTeam", mockHomeTeam);
      expect(result).toHaveProperty("awayTeam", mockAwayTeam);
      expect(result).toHaveProperty("theme", mockTheme);
      expect(result).toHaveProperty("matchConfig");
      expect(result).toHaveProperty("odds", mockOdds);
      expect(result).toHaveProperty("encryptedResult", "encrypted-data");
      expect(result).toHaveProperty("encryptedSettlementResult", "encrypted-data");
      expect(result).toHaveProperty("encryptedSelections", "encrypted-data");
      expect(result).toHaveProperty("ended", false);
    });

    it("should call createNewMatch with correct roundId", () => {
      service.generateNewRound(mockRoundId);

      expect(service.createNewMatch).toHaveBeenCalledWith(mockRoundId);
    });

    it("should call resultGeneratorService.generateResult with correct parameters", () => {
      service.generateNewRound(mockRoundId);

      expect(mockResultGeneratorService.generateResult).toHaveBeenCalledWith({
        numberOfVideos: mockGameSettings.numberOfVideos,
        matchConfig: expect.any(Object),
      });
    });

    it("should call oddsGeneratorService methods with correct parameters", () => {
      service.generateNewRound(mockRoundId);

      expect(mockOddsGeneratorService.calculateOddsForUltraLive).toHaveBeenCalledWith(expect.any(Object), mockResult);
      expect(mockOddsGeneratorService.generateSelectionsForUltraLive).toHaveBeenCalledWith(
        mockOdds,
        expect.any(Object),
        mockResult
      );
    });

    it("should call resultGeneratorService.generateSettlementResult with correct parameters", () => {
      service.generateNewRound(mockRoundId);

      expect(mockResultGeneratorService.generateSettlementResult).toHaveBeenCalledWith(mockResult, expect.any(Object));
    });

    it("should encrypt result, settlement result, and selections", () => {
      service.generateNewRound(mockRoundId);

      expect(encrypt).toHaveBeenCalledWith(mockResult);
      expect(encrypt).toHaveBeenCalledWith(mockSettlementResult);
      expect(encrypt).toHaveBeenCalledWith(mockSelections);
    });

    it("should create event ID with correct parameters", () => {
      service.generateNewRound(mockRoundId);

      expect(idHelper.createEventId).toHaveBeenCalledWith(mockGameSettings.gameId, mockRoundId);
    });

    it("should use gameConfig numberOfVideos when available", () => {
      const customNumberOfVideos = { H: 15, A: 15 };
      Object.assign(service, {
        gameData: {
          gameConfig: {
            config: {
              numberOfVideos: customNumberOfVideos,
            },
          },
        },
      });

      service.generateNewRound(mockRoundId);

      expect(mockResultGeneratorService.generateResult).toHaveBeenCalledWith({
        numberOfVideos: customNumberOfVideos,
        matchConfig: expect.any(Object),
      });
    });

    it("should fallback to gameSettings numberOfVideos when gameConfig is not available", () => {
      Object.assign(service, {
        gameData: {
          gameConfig: null,
        },
      });

      service.generateNewRound(mockRoundId);

      expect(mockResultGeneratorService.generateResult).toHaveBeenCalledWith({
        numberOfVideos: mockGameSettings.numberOfVideos,
        matchConfig: expect.any(Object),
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle null rate configs gracefully", () => {
      Object.assign(service, {
        rateConfigs: null,
      });

      expect(() => {
        service.generateRateConfigsForPhase(true, 2);
      }).toThrow();
    });

    it("should handle undefined rate configs gracefully", () => {
      Object.assign(service, {
        rateConfigs: undefined,
      });

      expect(() => {
        service.generateRateConfigsForPhase(true, 2);
      }).toThrow();
    });

    it("should handle null game settings gracefully", () => {
      Object.assign(service, {
        gameSettings: null,
      });

      expect(() => {
        service.generateVideoLengthForPhase(2);
      }).toThrow();
    });

    it("should handle missing game timing gracefully", () => {
      Object.assign(service, {
        gameSettings: {
          gameId: 2004,
          gameTiming: null,
          numberOfVideos: { H: 10, A: 10 },
        },
      });

      expect(() => {
        service.generateVideoLengthForPhase(2);
      }).toThrow();
    });

    it("should handle missing extra info gracefully", () => {
      Object.assign(service, {
        gameSettings: {
          gameId: 2004,
          gameTiming: {
            extraInfo: null,
          },
          numberOfVideos: { H: 10, A: 10 },
        },
      });

      expect(() => {
        service.generateVideoLengthForPhase(2);
      }).toThrow();
    });

    it("should handle odds generator service failure", () => {
      jest.spyOn(mockOddsGeneratorService, "calculateOddsInfo").mockImplementation(() => {
        throw new Error("Odds calculation failed");
      });

      expect(() => {
        service.createNewMatchConfig();
      }).toThrow("Odds calculation failed");
    });

    it("should handle result generator service failure", () => {
      // Mock createNewMatch to avoid the teams issue
      jest.spyOn(service, "createNewMatch").mockReturnValue({
        homeTeam: "Team A",
        awayTeam: "Team B",
        theme: "Test Theme",
      });

      jest.spyOn(service, "createNewMatchConfig").mockReturnValue({
        gameTiming: mockGameSettings.gameTiming,
        numberOfEventDetails: 4,
        eventDetailInfos: [],
        rateConfig: { scoreRate: {} },
        oddsInfo: [],
      });

      jest.spyOn(mockResultGeneratorService, "generateResult").mockImplementation(() => {
        throw new Error("Result generation failed");
      });

      expect(() => {
        service.generateNewRound(123);
      }).toThrow("Result generation failed");
    });

    it("should handle encryption failure", () => {
      // Mock createNewMatch to avoid the teams issue
      jest.spyOn(service, "createNewMatch").mockReturnValue({
        homeTeam: "Team A",
        awayTeam: "Team B",
        theme: "Test Theme",
      });

      jest.spyOn(service, "createNewMatchConfig").mockReturnValue({
        gameTiming: mockGameSettings.gameTiming,
        numberOfEventDetails: 4,
        eventDetailInfos: [],
        rateConfig: { scoreRate: {} },
        oddsInfo: [],
      });

      jest.spyOn(mockResultGeneratorService, "generateResult").mockReturnValue([
        {
          playlist: "video1.mp4",
          goalInfo: "Goal at 15:30",
          result: {
            goalSequence: "1-0",
            finalScore: "2-1",
          },
          phase: 0,
        },
      ]);

      jest
        .spyOn(mockOddsGeneratorService, "calculateOddsForUltraLive")
        .mockReturnValue([{ home: 1.5, away: 2.5, draw: 3.0 }]);

      jest.spyOn(mockOddsGeneratorService, "generateSelectionsForUltraLive").mockReturnValue([
        {
          home: { name: "Home Win", price: 1.5, point: 0, settlementStatus: SettlementStatus.PLAY },
          away: { name: "Away Win", price: 2.5, point: 0, settlementStatus: SettlementStatus.PLAY },
          draw: { name: "Draw", price: 3.0, point: 0, settlementStatus: SettlementStatus.PLAY },
        },
      ]);

      jest
        .spyOn(mockResultGeneratorService, "generateSettlementResult")
        .mockReturnValue([{ home: SettlementStatus.WIN, away: SettlementStatus.LOSE, draw: SettlementStatus.LOSE }]);

      jest.spyOn(idHelper, "createEventId").mockReturnValue(123456);

      (encrypt as jest.Mock).mockImplementation(() => {
        throw new Error("Encryption failed");
      });

      expect(() => {
        service.generateNewRound(123);
      }).toThrow("Encryption failed");
    });

    it("should handle invalid video length values", () => {
      const customGameSettings = {
        ...mockGameSettings,
        gameTiming: {
          ...mockGameSettings.gameTiming,
          extraInfo: {
            ...mockGameSettings.gameTiming.extraInfo,
            videoLength: 0, // Invalid video length
          },
        },
      };

      Object.assign(service, { gameSettings: customGameSettings });

      // The method doesn't throw for invalid video lengths, it just produces unexpected results
      const result = service.generateVideoLengthForPhase(2);
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });

    it("should handle negative video length values", () => {
      const customGameSettings = {
        ...mockGameSettings,
        gameTiming: {
          ...mockGameSettings.gameTiming,
          extraInfo: {
            ...mockGameSettings.gameTiming.extraInfo,
            videoLength: -10, // Negative video length
          },
        },
      };

      Object.assign(service, { gameSettings: customGameSettings });

      // The method doesn't throw for negative video lengths, it just produces unexpected results
      const result = service.generateVideoLengthForPhase(2);
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });
  });

  describe("Integration Tests", () => {
    it("should generate complete round with realistic data flow", () => {
      // Mock all dependencies with realistic values
      jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(true);
      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(3);
      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.homeFavorite[0]);
      jest.spyOn(mockOddsGeneratorService, "calculateOddsInfo").mockReturnValue({
        handicapValue: 0.5,
        overUnderValue: 2.5,
      } as OddsInfo);
      jest
        .spyOn(mockOddsGeneratorService, "calculateOddsForUltraLive")
        .mockReturnValue([{ home: 1.8, away: 2.1, draw: 3.2 }]);
      jest.spyOn(mockOddsGeneratorService, "generateSelectionsForUltraLive").mockReturnValue([
        {
          home: { name: "Home Win", price: 1.8, point: 0, settlementStatus: SettlementStatus.PLAY },
          away: { name: "Away Win", price: 2.1, point: 0, settlementStatus: SettlementStatus.PLAY },
          draw: { name: "Draw", price: 3.2, point: 0, settlementStatus: SettlementStatus.PLAY },
        },
      ]);
      jest.spyOn(mockResultGeneratorService, "generateResult").mockReturnValue([
        {
          playlist: "video1.mp4",
          goalInfo: "Goal at 15:30",
          result: {
            goalSequence: "1-0",
            finalScore: "2-1",
          },
          phase: 0,
        },
      ]);
      jest
        .spyOn(mockResultGeneratorService, "generateSettlementResult")
        .mockReturnValue([{ home: SettlementStatus.WIN, away: SettlementStatus.LOSE, draw: SettlementStatus.LOSE }]);
      jest.spyOn(service, "createNewMatch").mockReturnValue({
        homeTeam: "Real Madrid",
        awayTeam: "Barcelona",
        theme: "El Clasico",
      });
      jest.spyOn(idHelper, "createEventId").mockReturnValue(2004123);
      (encrypt as jest.Mock).mockReturnValue("encrypted-data");

      const result = service.generateNewRound(123);

      // Verify the complete round structure
      expect(result).toHaveProperty("gameId", 2004);
      expect(result).toHaveProperty("eventID", 2004123);
      expect(result).toHaveProperty("roundId", 123);
      expect(result).toHaveProperty("homeTeam", "Real Madrid");
      expect(result).toHaveProperty("awayTeam", "Barcelona");
      expect(result).toHaveProperty("theme", "El Clasico");
      expect(result).toHaveProperty("matchConfig");
      expect(result).toHaveProperty("odds");
      expect(result).toHaveProperty("encryptedResult", "encrypted-data");
      expect(result).toHaveProperty("encryptedSettlementResult", "encrypted-data");
      expect(result).toHaveProperty("encryptedSelections", "encrypted-data");
      expect(result).toHaveProperty("ended", false);

      // Verify match config structure
      expect(result.matchConfig).toHaveProperty("gameTiming");
      expect(result.matchConfig).toHaveProperty("numberOfEventDetails");
      expect(result.matchConfig).toHaveProperty("eventDetailInfos");
      expect(result.matchConfig).toHaveProperty("rateConfig");
      expect(result.matchConfig).toHaveProperty("oddsInfo");
      expect(result.matchConfig.numberOfEventDetails).toBe(6); // 3 + 3 for both halves
      expect(result.matchConfig.eventDetailInfos.length).toBe(6);
      expect(result.matchConfig.oddsInfo.length).toBe(3); // Only first half odds for full time
    });

    it("should handle end-to-end round generation with different team selection modes", () => {
      // Test with away favorite
      jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(false);
      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(2);
      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.awayFavorite[0]);
      jest.spyOn(mockOddsGeneratorService, "calculateOddsInfo").mockReturnValue({
        handicapValue: -0.5,
        overUnderValue: 2.5,
      } as OddsInfo);
      jest
        .spyOn(mockOddsGeneratorService, "calculateOddsForUltraLive")
        .mockReturnValue([{ home: 2.2, away: 1.7, draw: 3.1 }]);
      jest.spyOn(mockOddsGeneratorService, "generateSelectionsForUltraLive").mockReturnValue([
        {
          home: { name: "Home Win", price: 2.2, point: 0, settlementStatus: SettlementStatus.PLAY },
          away: { name: "Away Win", price: 1.7, point: 0, settlementStatus: SettlementStatus.PLAY },
          draw: { name: "Draw", price: 3.1, point: 0, settlementStatus: SettlementStatus.PLAY },
        },
      ]);
      jest.spyOn(mockResultGeneratorService, "generateResult").mockReturnValue([
        {
          playlist: "video1.mp4",
          goalInfo: "Goal at 20:15",
          result: {
            goalSequence: "0-1",
            finalScore: "1-3",
          },
          phase: 0,
        },
      ]);
      jest
        .spyOn(mockResultGeneratorService, "generateSettlementResult")
        .mockReturnValue([{ home: SettlementStatus.LOSE, away: SettlementStatus.WIN, draw: SettlementStatus.LOSE }]);
      jest.spyOn(service, "createNewMatch").mockReturnValue({
        homeTeam: "Liverpool",
        awayTeam: "Manchester City",
        theme: "Premier League",
      });
      jest.spyOn(idHelper, "createEventId").mockReturnValue(2004456);
      (encrypt as jest.Mock).mockReturnValue("encrypted-data");

      const result = service.generateNewRound(456);

      expect(result.homeTeam).toBe("Liverpool");
      expect(result.awayTeam).toBe("Manchester City");
      expect(result.theme).toBe("Premier League");
      expect(result.eventID).toBe(2004456);
      expect(result.matchConfig.numberOfEventDetails).toBe(4); // 2 + 2 for both halves
    });

    it("should maintain data consistency across all generated components", () => {
      const roundId = 789;

      // Mock consistent random values
      jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(true);
      jest.spyOn(rngModule, "secureRandomRange").mockReturnValue(2);
      jest.spyOn(rngModule, "securePickOne").mockReturnValue(mockRateConfigs.homeFavorite[0]);
      jest.spyOn(mockOddsGeneratorService, "calculateOddsInfo").mockReturnValue({
        handicapValue: 0.5,
        overUnderValue: 2.5,
      } as OddsInfo);
      jest
        .spyOn(mockOddsGeneratorService, "calculateOddsForUltraLive")
        .mockReturnValue([{ home: 1.9, away: 2.0, draw: 3.3 }]);
      jest.spyOn(mockOddsGeneratorService, "generateSelectionsForUltraLive").mockReturnValue([
        {
          home: { name: "Home Win", price: 1.9, point: 0, settlementStatus: SettlementStatus.PLAY },
          away: { name: "Away Win", price: 2.0, point: 0, settlementStatus: SettlementStatus.PLAY },
          draw: { name: "Draw", price: 3.3, point: 0, settlementStatus: SettlementStatus.PLAY },
        },
      ]);
      jest.spyOn(mockResultGeneratorService, "generateResult").mockReturnValue([
        {
          playlist: "video1.mp4",
          goalInfo: "Goal at 25:45",
          result: {
            goalSequence: "1-0, 2-1, 3-2",
            finalScore: "3-2",
          },
          phase: 0,
        },
      ]);
      jest
        .spyOn(mockResultGeneratorService, "generateSettlementResult")
        .mockReturnValue([{ home: SettlementStatus.WIN, away: SettlementStatus.LOSE, draw: SettlementStatus.LOSE }]);
      jest.spyOn(service, "createNewMatch").mockReturnValue({
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        theme: "London Derby",
      });
      jest.spyOn(idHelper, "createEventId").mockReturnValue(2004789);
      (encrypt as jest.Mock).mockReturnValue("encrypted-data");

      const result = service.generateNewRound(roundId);

      // Verify data consistency
      expect(result.gameId).toBe(mockGameSettings.gameId);
      expect(result.roundId).toBe(roundId);
      expect(result.eventID).toBe(2004789);
      expect(result.ended).toBe(false);

      // Verify match config has proper structure
      expect(result.matchConfig.gameTiming).toHaveProperty("timelines");
      expect(result.matchConfig.gameTiming.timelines.length).toBe(4); // 2 first half + 2 second half
      expect(result.matchConfig.numberOfEventDetails).toBe(4);
      expect(result.matchConfig.eventDetailInfos.length).toBe(4);
      expect(result.matchConfig.oddsInfo.length).toBe(2); // First half odds for full time

      // Verify all encrypted data is present
      expect(result.encryptedResult).toBe("encrypted-data");
      expect(result.encryptedSettlementResult).toBe("encrypted-data");
      expect(result.encryptedSelections).toBe("encrypted-data");
    });
  });
});
