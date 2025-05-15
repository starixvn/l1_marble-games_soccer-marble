import * as rngModule from "sc-core-rng";
import * as oddsHelper from "../../../src/helpers/odds-helper";
import * as resultHelper from "../../../src/helpers/result-helper";
import { MatchConfigType, RoundResultType, SettlementStatus } from "../../../src/types";
import { RoundGeneratorService } from "../../../src/services/round-generator-service";
import { mockContainer } from "../global-stubs";
import { idHelper } from "../../../src/helpers";

jest.mock("sc-core-rng");
jest.mock("../../../src/helpers/odds-helper");
jest.mock("../../../src/helpers/result-helper");
jest.mock("../../../src/helpers/id-helper");

describe("RoundGeneratorService", () => {
  let service: RoundGeneratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoundGeneratorService(mockContainer);
  });

  describe("createNewMatch", () => {
    it("should return shuffled home and away teams", () => {
      // Arrange
      const shuffleMock = jest.spyOn(rngModule, "secureShuffle").mockReturnValue(["Team B", "Team A"]);

      // Act
      const result = service.createNewMatch();

      // Assert
      expect(shuffleMock).toHaveBeenCalledWith(mockContainer.gameSettings.teams);
      expect(result).toEqual({ homeTeam: "Team B", awayTeam: "Team A" });
    });
  });

  describe("createNewMatchConfig", () => {
    it("should create match config with shuffled first and second half", () => {
      // Arrange
      const shuffleMock = jest
        .spyOn(rngModule, "secureShuffle")
        .mockReturnValue([mockContainer.rateConfigs[1], mockContainer.rateConfigs[0]]);

      // Act
      const result = service.createNewMatchConfig();

      // Assert
      expect(shuffleMock).toHaveBeenCalledWith(mockContainer.rateConfigs);
      expect(result).toEqual({
        firstHalf: mockContainer.rateConfigs[1],
        secondHalf: mockContainer.rateConfigs[0],
      });
    });
  });

  describe("generateNewRound", () => {
    it("should generate a new round with match and config", () => {
      // Arrange
      const roundId = 1;
      const mockMatch = { homeTeam: "Team A", awayTeam: "Team B" };
      const mockConfig = {
        firstHalf: mockContainer.rateConfigs[0],
        secondHalf: mockContainer.rateConfigs[1],
      };
      const mockResult = {
        drawResults: [
          {
            playlist: "video1",
            result: {
              goalSequence: "H",
              finalScore: "1:0",
            },
          },
        ],
      };
      const mockOddsResult = {
        odds: [
          {
            ft_hdp_home: 1.8,
            ft_hdp_away: 2.2,
            ft_1x2_home: 1.9,
            ft_1x2_away: 2.1,
            ft_1x2_draw: 2.0,
            ft_ou_over: 1.9,
            ft_ou_under: 2.1,
            ft_oe_odd: 1.9,
            ft_oe_even: 2.1,
            h1_hdp_home: 1.8,
            h1_hdp_away: 2.2,
            h1_1x2_home: 1.9,
            h1_1x2_away: 2.1,
            h1_1x2_draw: 2.0,
            h1_ou_over: 1.9,
            h1_ou_under: 2.1,
            h1_oe_odd: 1.9,
            h1_oe_even: 2.1,
          },
        ],
        matchConfig: {
          ...mockConfig,
          overUnderValue: 2.5,
          handicapValue: 0.5,
          firstHalf: {
            ...mockConfig.firstHalf,
            overUnderValue: 1.5,
            handicapValue: 0.5,
          },
          secondHalf: {
            ...mockConfig.secondHalf,
            overUnderValue: 0.5,
            handicapValue: 0,
          },
        },
        selections: [
          {
            ft_hdp_home: { name: "ft_hdp_home", price: 1.8, point: 0.5, settlementStatus: SettlementStatus.PLAY },
            ft_hdp_away: { name: "ft_hdp_away", price: 2.2, point: -0.5, settlementStatus: SettlementStatus.PLAY },
            ft_1x2_home: { name: "ft_1x2_home", price: 1.9, point: 0, settlementStatus: SettlementStatus.PLAY },
            ft_1x2_away: { name: "ft_1x2_away", price: 2.1, point: 0, settlementStatus: SettlementStatus.PLAY },
            ft_1x2_draw: { name: "ft_1x2_draw", price: 2.0, point: 0, settlementStatus: SettlementStatus.PLAY },
            ft_ou_over: { name: "ft_ou_over", price: 1.9, point: 2.5, settlementStatus: SettlementStatus.PLAY },
            ft_ou_under: { name: "ft_ou_under", price: 2.1, point: 2.5, settlementStatus: SettlementStatus.PLAY },
            ft_oe_odd: { name: "ft_oe_odd", price: 1.9, point: 0, settlementStatus: SettlementStatus.PLAY },
            ft_oe_even: { name: "ft_oe_even", price: 2.1, point: 0, settlementStatus: SettlementStatus.PLAY },
          },
        ],
      };
      const mockSettlementResult = [
        {
          ft_hdp_home: SettlementStatus.WIN,
          ft_hdp_away: SettlementStatus.LOSE,
          ft_1x2_home: SettlementStatus.WIN,
          ft_1x2_away: SettlementStatus.LOSE,
          ft_1x2_draw: SettlementStatus.LOSE,
          ft_ou_over: SettlementStatus.WIN,
          ft_ou_under: SettlementStatus.LOSE,
          ft_oe_odd: SettlementStatus.WIN,
          ft_oe_even: SettlementStatus.LOSE,
          h1_hdp_home: SettlementStatus.WIN,
          h1_hdp_away: SettlementStatus.LOSE,
          h1_1x2_home: SettlementStatus.WIN,
          h1_1x2_away: SettlementStatus.LOSE,
          h1_1x2_draw: SettlementStatus.LOSE,
          h1_ou_over: SettlementStatus.WIN,
          h1_ou_under: SettlementStatus.LOSE,
          h1_oe_odd: SettlementStatus.WIN,
          h1_oe_even: SettlementStatus.LOSE,
        },
      ];

      jest.spyOn(service, "createNewMatch").mockReturnValue(mockMatch);
      jest.spyOn(service, "createNewMatchConfig").mockReturnValue(mockConfig);
      jest.spyOn(service, "generateResult").mockReturnValue(mockResult);
      jest.spyOn(service, "generateRoundOddsAndUpdateMatchConfig").mockReturnValue(mockOddsResult);
      jest.spyOn(service, "getSettlementResult").mockReturnValue(mockSettlementResult);
      jest.spyOn(idHelper, "createEventId").mockReturnValue(123);

      // Act
      const result = service.generateNewRound(roundId);

      // Assert
      expect(result).toEqual({
        eventID: 123,
        roundId,
        homeTeam: mockMatch.homeTeam,
        awayTeam: mockMatch.awayTeam,
        matchConfig: mockOddsResult.matchConfig,
        odds: mockOddsResult.odds,
        encryptedResult: expect.any(String),
        encryptedSettlementResult: expect.any(String),
        encryptedSelections: expect.any(String),
        ended: false,
      });
      expect(service.generateResult).toHaveBeenCalledWith(mockConfig, mockContainer.gameSettings.numberOfVideos);
      expect(service.generateRoundOddsAndUpdateMatchConfig).toHaveBeenCalledWith(mockConfig, "H");
      expect(service.getSettlementResult).toHaveBeenCalledWith(mockResult, mockOddsResult.matchConfig);
    });
  });

  describe("generateRoundOddsAndUpdateMatchConfig", () => {
    it("should call calculateOddsForRound with correct parameters", () => {
      // Arrange
      const matchConfig: MatchConfigType = {
        firstHalf: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } },
        secondHalf: { scoreRate: { "0-0": 0.5, "1-1": 0.5 } },
      };
      const firstHalfResult = "1-0";

      const expectedResult = {
        odds: [
          {
            ft_hdp_home: 1.8,
            ft_hdp_away: 2.2,
            ft_ou_over: 1.9,
            ft_ou_under: 2.1,
            ft_oe_odd: 1.9,
            ft_oe_even: 2.1,
          },
        ],
        matchConfig: {
          overUnderValue: 2.5,
          handicapValue: 0.5,
          firstHalf: { scoreRate: { "1-0": 0.5, "0-1": 0.5 }, overUnderValue: 1.5, handicapValue: 0.5 },
          secondHalf: { scoreRate: { "0-0": 0.5, "1-1": 0.5 }, overUnderValue: 0.5, handicapValue: 0 },
        },
        selections: [{}],
      };

      jest.spyOn(oddsHelper, "calculateOddsForRound").mockReturnValue(expectedResult);

      // Act
      const result = service.generateRoundOddsAndUpdateMatchConfig(matchConfig, firstHalfResult);

      // Assert
      expect(oddsHelper.calculateOddsForRound).toHaveBeenCalledWith(matchConfig, firstHalfResult);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("generateResult", () => {
    it("should call generateResult helper with correct parameters", () => {
      // Arrange
      const matchConfig: MatchConfigType = {
        firstHalf: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } },
        secondHalf: { scoreRate: { "0-0": 0.5, "1-1": 0.5 } },
      };
      const numberOfVideos = { "1-0": 2, "0-0": 1 };
      const expectedResult: RoundResultType = {
        drawResults: [
          {
            playlist: "video1",
            result: {
              goalSequence: "H",
              finalScore: "1:0",
            },
          },
          {
            playlist: "video2",
            result: {
              goalSequence: "0",
              finalScore: "0:0",
            },
          },
        ],
      };

      jest.spyOn(resultHelper, "generateResult").mockReturnValue(expectedResult);

      // Act
      const result = service.generateResult(matchConfig, numberOfVideos);

      // Assert
      expect(resultHelper.generateResult).toHaveBeenCalledWith({
        numberOfVideos,
        matchConfig,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getSettlementResult", () => {
    it("should call getSettlementResult helper with correct parameters", () => {
      // Arrange
      const matchConfig: MatchConfigType = {
        firstHalf: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } },
        secondHalf: { scoreRate: { "0-0": 0.5, "1-1": 0.5 } },
      };
      const result: RoundResultType = {
        drawResults: [
          {
            playlist: "video1",
            result: {
              goalSequence: "H",
              finalScore: "1:0",
            },
          },
          {
            playlist: "video2",
            result: {
              goalSequence: "0",
              finalScore: "0:0",
            },
          },
        ],
      };

      const expectedSettlementResult = [
        {
          ft_hdp_home: SettlementStatus.WIN,
          ft_hdp_away: SettlementStatus.LOSE,
        },
        {
          ft_hdp_home: SettlementStatus.WIN,
          ft_hdp_away: SettlementStatus.LOSE,
        },
      ];

      jest.spyOn(resultHelper, "getSettlementResult").mockReturnValue(expectedSettlementResult);

      // Act
      const settlementResult = service.getSettlementResult(result, matchConfig);

      // Assert
      expect(resultHelper.getSettlementResult).toHaveBeenCalledWith(result, matchConfig);
      expect(settlementResult).toEqual(expectedSettlementResult);
    });
  });
});
