import { MatchGeneratorService } from "../../../src/services/match-generator-service";
import * as rngModule from "sc-core-rng";
import * as oddsHelper from "../../../src/helpers/odds-helper";
import * as resultHelper from "../../../src/helpers/result-helper";
import { MatchConfigType, RoundResultType, SettlementStatus } from "../../../src/types";

jest.mock("sc-core-rng");
jest.mock("../../../src/helpers/odds-helper");
jest.mock("../../../src/helpers/result-helper");

describe("MatchGeneratorService", () => {
  let service: MatchGeneratorService;
  let container: any;
  
  beforeEach(() => {
    // Arrange
    container = {
      gameSettings: {
        teams: ["Team A", "Team B", "Team C"],
      },
      rateConfigs: [
        { scoreRate: { "1-0": 0.3, "0-1": 0.3, "0-0": 0.4 } },
        { scoreRate: { "2-0": 0.4, "0-2": 0.4, "1-1": 0.2 } },
      ],
    };
    
    service = new MatchGeneratorService(container);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe("createNewMatch", () => {
    it("should return shuffled home and away teams", () => {
      // Arrange
      const shuffleMock = jest.spyOn(rngModule, "secureShuffle").mockReturnValue(["Team B", "Team A"]);
      
      // Act
      const result = service.createNewMatch();
      
      // Assert
      expect(shuffleMock).toHaveBeenCalledWith(container.gameSettings.teams);
      expect(result).toEqual({ homeTeam: "Team B", awayTeam: "Team A" });
    });
  });

  describe("createNewMatchConfig", () => {
    it("should create match config with random first and second half", () => {
      // Arrange
      const pickOneMock = jest.spyOn(rngModule, "securePickOne");
      pickOneMock.mockReturnValueOnce(container.rateConfigs[0]);
      pickOneMock.mockReturnValueOnce(container.rateConfigs[1]);
      
      // Act
      const result = service.createNewMatchConfig();
      
      // Assert
      expect(pickOneMock).toHaveBeenCalledTimes(2);
      expect(pickOneMock).toHaveBeenCalledWith(container.rateConfigs);
      expect(result).toEqual({
        firstHalf: container.rateConfigs[0],
        secondHalf: container.rateConfigs[1],
      });
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
        odds: [{
          ft_hdp_home: 1.8,
          ft_hdp_away: 2.2,
          ft_ou_over: 1.9,
          ft_ou_under: 2.1,
          ft_oe_odd: 1.9,
          ft_oe_even: 2.1,
        }],
        matchConfig: {
          overUnderValue: 2.5,
          handicapValue: 0.5,
          firstHalf: { scoreRate: { "1-0": 0.5, "0-1": 0.5 }, overUnderValue: 1.5, handicapValue: 0.5 },
          secondHalf: { scoreRate: { "0-0": 0.5, "1-1": 0.5 }, overUnderValue: 0.5, handicapValue: 0 },
        },
        selections: [{}]
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
        drawResults: [{
          playlist: "video1",
          result: {
            goalSequence: "H",
            finalScore: "1:0"
          }
        }, {
          playlist: "video2",
          result: {
            goalSequence: "0",
            finalScore: "0:0"
          }
        }]
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
        drawResults: [{
          playlist: "video1",
          result: {
            goalSequence: "H",
            finalScore: "1:0"
          }
        }, {
          playlist: "video2",
          result: {
            goalSequence: "0",
            finalScore: "0:0"
          }
        }]
      };
      
      const expectedSettlementResult = [
        {
          ft_hdp_home: SettlementStatus.WIN,
          ft_hdp_away: SettlementStatus.LOSE
        },
        {
          ft_hdp_home: SettlementStatus.WIN,
          ft_hdp_away: SettlementStatus.LOSE
        }
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
