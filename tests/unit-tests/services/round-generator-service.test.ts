import * as rngModule from "sc-core-rng";
import * as oddsHelper from "../../../src/helpers/odds-helper";
import * as resultHelper from "../../../src/helpers/result-helper";
import * as cryptoHelper from "../../../src/helpers/crypto-helper";
import { MatchConfigType, RoundResultType, SettlementStatus } from "../../../src/types";
import { RoundGeneratorService } from "../../../src/services/round-generator-service";
import { mockContainer } from "../global-stubs";
import { idHelper } from "../../../src/helpers";

jest.mock("sc-core-rng");
jest.mock("../../../src/helpers/odds-helper");
jest.mock("../../../src/helpers/result-helper");
jest.mock("../../../src/helpers/crypto-helper");
jest.mock("../../../src/helpers/id-helper");

describe("RoundGeneratorService", () => {
  let service: RoundGeneratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoundGeneratorService(mockContainer);
  });

  describe("createNewMatchFromRandomTeams", () => {
    it("should return shuffled teams from gameConfig if available", () => {
      // Arrange
      const gameConfigTeams = ["Team C", "Team D"];
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { teams: gameConfigTeams, enabled: true, teamSelectionMode: 1, matches: [], numberOfVideos: {} },
      } as any;
      const shuffleMock = jest.spyOn(rngModule, "secureShuffle").mockReturnValue(["Team D", "Team C"]);

      // Act
      const result = service.createNewMatchFromRandomTeams();

      // Assert
      expect(shuffleMock).toHaveBeenCalledWith(gameConfigTeams);
      expect(result).toEqual({ homeTeam: "Team D", awayTeam: "Team C" });
    });

    it("should return shuffled teams from gameSettings if gameConfig not available", () => {
      // Arrange
      mockContainer.gameData.gameConfig = null;
      const shuffleMock = jest.spyOn(rngModule, "secureShuffle").mockReturnValue(["Team B", "Team A"]);

      // Act
      const result = service.createNewMatchFromRandomTeams();

      // Assert
      expect(shuffleMock).toHaveBeenCalledWith(mockContainer.gameSettings.teams);
      expect(result).toEqual({ homeTeam: "Team B", awayTeam: "Team A" });
    });
  });

  describe("createNewMatchFromMatches", () => {
    it("should return match from matches array based on roundId", () => {
      // Arrange
      const matches = [
        { homeTeam: "Team A", awayTeam: "Team B" },
        { homeTeam: "Team C", awayTeam: "Team D" },
      ];
      const teams = ["Team A", "Team B", "Team C", "Team D"];
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { matches, teams, enabled: true, teamSelectionMode: 1, numberOfVideos: {} },
      } as any;

      // Act
      const result1 = service.createNewMatchFromMatches(0);
      const result2 = service.createNewMatchFromMatches(1);
      const result3 = service.createNewMatchFromMatches(2); // Should wrap around

      // Assert
      expect(result1).toEqual({ homeTeam: "Team A", awayTeam: "Team B" });
      expect(result2).toEqual({ homeTeam: "Team C", awayTeam: "Team D" });
      expect(result3).toEqual({ homeTeam: "Team A", awayTeam: "Team B" });
    });

    it("should fallback to random teams if no matches available", () => {
      // Arrange
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { matches: [], enabled: true, teamSelectionMode: 1, teams: [], numberOfVideos: {} },
      } as any;
      const shuffleMock = jest.spyOn(rngModule, "secureShuffle").mockReturnValue(["Team B", "Team A"]);
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team B", awayTeam: "Team A" });

      // Act
      const result = service.createNewMatchFromMatches(0);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team B", awayTeam: "Team A" });
    });

    it("should fallback to random teams if matches is undefined", () => {
      // Arrange
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { matches: undefined, enabled: true, teamSelectionMode: 1, teams: [], numberOfVideos: {} },
      } as any;
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team B", awayTeam: "Team A" });

      // Act
      const result = service.createNewMatchFromMatches(0);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team B", awayTeam: "Team A" });
    });

    it("should fallback to random teams if homeTeam from match is not in available teams", () => {
      // Arrange
      const matches = [
        { homeTeam: "Team A", awayTeam: "Team B" },
        { homeTeam: "Team C", awayTeam: "Team D" },
      ];
      const teams = ["Team B", "Team C", "Team D"]; // Team A is missing
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { matches, teams, enabled: true, teamSelectionMode: 1, numberOfVideos: {} },
      } as any;
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team C", awayTeam: "Team B" });

      // Act
      const result = service.createNewMatchFromMatches(0);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team C", awayTeam: "Team B" });
    });

    it("should fallback to random teams if awayTeam from match is not in available teams", () => {
      // Arrange
      const matches = [
        { homeTeam: "Team A", awayTeam: "Team B" },
        { homeTeam: "Team C", awayTeam: "Team D" },
      ];
      const teams = ["Team A", "Team C", "Team D"]; // Team B is missing
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { matches, teams, enabled: true, teamSelectionMode: 1, numberOfVideos: {} },
      } as any;
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team A", awayTeam: "Team C" });

      // Act
      const result = service.createNewMatchFromMatches(0);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team A", awayTeam: "Team C" });
    });

    it("should fallback to random teams if both teams from match are not in available teams", () => {
      // Arrange
      const matches = [
        { homeTeam: "Team A", awayTeam: "Team B" },
        { homeTeam: "Team C", awayTeam: "Team D" },
      ];
      const teams = ["Team E", "Team F", "Team G"]; // Neither Team A nor Team B are available
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { matches, teams, enabled: true, teamSelectionMode: 1, numberOfVideos: {} },
      } as any;
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team E", awayTeam: "Team F" });

      // Act
      const result = service.createNewMatchFromMatches(0);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team E", awayTeam: "Team F" });
    });

    it("should fallback to random teams if match is empty", () => {
      // Arrange
      const matches = [{}, {}];
      const teams = ["Team E", "Team F", "Team G"]; // Neither Team A nor Team B are available
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { matches, teams, enabled: true, teamSelectionMode: 1, numberOfVideos: {} },
      } as any;
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team E", awayTeam: "Team F" });

      // Act
      const result = service.createNewMatchFromMatches(0);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team E", awayTeam: "Team F" });
    });

    it("should use teams from gameSettings when gameConfig teams are not available", () => {
      // Arrange
      const matches = [
        { homeTeam: "Team A", awayTeam: "Team B" },
        { homeTeam: "Team C", awayTeam: "Team D" },
      ];
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { matches, enabled: true, teamSelectionMode: 1, numberOfVideos: {} }, // teams not specified
      } as any;
      // mockContainer.gameSettings.teams contains ["Team A", "Team B"] by default
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team A", awayTeam: "Team B" });

      // Act
      const result = service.createNewMatchFromMatches(0);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team A", awayTeam: "Team B" });
    });
  });

  describe("createNewMatch", () => {
    it("should use random teams when teamSelectionMode is 1", () => {
      // Arrange
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { teamSelectionMode: 1, enabled: true, teams: [], matches: [], numberOfVideos: {} },
      } as any;
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team B", awayTeam: "Team A" });

      // Act
      const result = service.createNewMatch(1);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team B", awayTeam: "Team A" });
    });

    it("should use matches when teamSelectionMode is 2", () => {
      // Arrange
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { teamSelectionMode: 2, enabled: true, teams: [], matches: [], numberOfVideos: {} },
      } as any;
      jest.spyOn(service, "createNewMatchFromMatches").mockReturnValue({ homeTeam: "Team C", awayTeam: "Team D" });

      // Act
      const result = service.createNewMatch(1);

      // Assert
      expect(service.createNewMatchFromMatches).toHaveBeenCalledWith(1);
      expect(result).toEqual({ homeTeam: "Team C", awayTeam: "Team D" });
    });

    it("should default to random teams when teamSelectionMode is not specified", () => {
      // Arrange
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { enabled: true, teams: [], matches: [], numberOfVideos: {} },
      } as any;
      jest.spyOn(service, "createNewMatchFromRandomTeams").mockReturnValue({ homeTeam: "Team B", awayTeam: "Team A" });

      // Act
      const result = service.createNewMatch(1);

      // Assert
      expect(service.createNewMatchFromRandomTeams).toHaveBeenCalled();
      expect(result).toEqual({ homeTeam: "Team B", awayTeam: "Team A" });
    });
  });

  describe("createNewMatchConfig", () => {
    it("should create match config with shuffled first and second half when home is favorite", () => {
      // Arrange
      const secureRandomBoolMock = jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(true);
      const shuffleMock = jest
        .spyOn(rngModule, "secureShuffle")
        .mockReturnValue([mockContainer.rateConfigs.homeFavorite[1], mockContainer.rateConfigs.homeFavorite[0]]);

      // Act
      const result = service.createNewMatchConfig();

      // Assert
      expect(secureRandomBoolMock).toHaveBeenCalled();
      expect(shuffleMock).toHaveBeenCalledWith(mockContainer.rateConfigs.homeFavorite);
      expect(result).toEqual({
        firstHalf: mockContainer.rateConfigs.homeFavorite[1],
        secondHalf: mockContainer.rateConfigs.homeFavorite[0],
      });
    });

    it("should create match config with shuffled first and second half when away is favorite", () => {
      // Arrange
      const secureRandomBoolMock = jest.spyOn(rngModule, "secureRandomBool").mockReturnValue(false);
      const shuffleMock = jest
        .spyOn(rngModule, "secureShuffle")
        .mockReturnValue([mockContainer.rateConfigs.awayFavorite[1], mockContainer.rateConfigs.awayFavorite[0]]);

      // Act
      const result = service.createNewMatchConfig();

      // Assert
      expect(secureRandomBoolMock).toHaveBeenCalled();
      expect(shuffleMock).toHaveBeenCalledWith(mockContainer.rateConfigs.awayFavorite);
      expect(result).toEqual({
        firstHalf: mockContainer.rateConfigs.awayFavorite[1],
        secondHalf: mockContainer.rateConfigs.awayFavorite[0],
      });
    });
  });

  describe("generateNewRound", () => {
    it("should generate a new round with match and config", () => {
      // Arrange
      mockContainer.gameData.gameConfig = {} as any;
      const roundId = 1;
      const mockMatch = { homeTeam: "Team A", awayTeam: "Team B" };
      const mockConfig = {
        firstHalf: mockContainer.rateConfigs.homeFavorite[0],
        secondHalf: mockContainer.rateConfigs.homeFavorite[1],
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
      jest.spyOn(service, "createNewMatchConfig").mockReturnValue(mockConfig as MatchConfigType);
      jest.spyOn(service, "generateResult").mockReturnValue(mockResult);
      jest.spyOn(service, "generateRoundOddsAndUpdateMatchConfig").mockReturnValue(mockOddsResult);
      jest.spyOn(service, "getSettlementResult").mockReturnValue(mockSettlementResult);
      jest.spyOn(idHelper, "createEventId").mockReturnValue(123);
      jest.spyOn(cryptoHelper, "encrypt").mockReturnValue("encrypted_data");

      // Act
      const result = service.generateNewRound(roundId);

      // Assert
      expect(result).toEqual({
        eventID: 123,
        roundId,
        gameId: mockContainer.gameSettings.gameId,
        homeTeam: mockMatch.homeTeam,
        awayTeam: mockMatch.awayTeam,
        matchConfig: mockOddsResult.matchConfig,
        odds: mockOddsResult.odds,
        encryptedResult: "encrypted_data",
        encryptedSettlementResult: "encrypted_data",
        encryptedSelections: "encrypted_data",
        ended: false,
      });
      expect(service.createNewMatch).toHaveBeenCalledWith(roundId);
      expect(service.generateResult).toHaveBeenCalledWith(mockConfig, mockContainer.gameSettings.numberOfVideos);
      expect(service.generateRoundOddsAndUpdateMatchConfig).toHaveBeenCalledWith(mockConfig, "H");
      expect(service.getSettlementResult).toHaveBeenCalledWith(mockResult, mockOddsResult.matchConfig);
      expect(cryptoHelper.encrypt).toHaveBeenCalledTimes(3);
    });

    it("should use gameConfig numberOfVideos when available", () => {
      // Arrange
      const roundId = 1;
      const gameConfigNumberOfVideos = { H: 5, A: 3 };
      mockContainer.gameData.gameConfig = {
        gameId: 2001,
        config: { numberOfVideos: gameConfigNumberOfVideos, enabled: true, teamSelectionMode: 1, teams: [], matches: [] },
      } as any;

      const mockMatch = { homeTeam: "Team A", awayTeam: "Team B" };
      const mockConfig = {
        firstHalf: mockContainer.rateConfigs.homeFavorite[0],
        secondHalf: mockContainer.rateConfigs.homeFavorite[1],
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
        odds: [],
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
        selections: [],
      };
      const mockSettlementResult = [] as any;

      jest.spyOn(service, "createNewMatch").mockReturnValue(mockMatch);
      jest.spyOn(service, "createNewMatchConfig").mockReturnValue(mockConfig as MatchConfigType);
      jest.spyOn(service, "generateResult").mockReturnValue(mockResult);
      jest.spyOn(service, "generateRoundOddsAndUpdateMatchConfig").mockReturnValue(mockOddsResult);
      jest.spyOn(service, "getSettlementResult").mockReturnValue(mockSettlementResult);
      jest.spyOn(idHelper, "createEventId").mockReturnValue(123);
      jest.spyOn(cryptoHelper, "encrypt").mockReturnValue("encrypted_data");

      // Act
      service.generateNewRound(roundId);

      // Assert
      expect(service.generateResult).toHaveBeenCalledWith(mockConfig, gameConfigNumberOfVideos);
    });
  });

  describe("generateRoundOddsAndUpdateMatchConfig", () => {
    it("should call calculateOddsForRound with correct parameters", () => {
      // Arrange
      const matchConfig = {
        firstHalf: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } } as any,
        secondHalf: { scoreRate: { "0-0": 0.5, "1-1": 0.5 } } as any,
      } as MatchConfigType;
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
      const matchConfig = {
        firstHalf: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } },
        secondHalf: { scoreRate: { "0-0": 0.5, "1-1": 0.5 } },
      } as any;
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
      const matchConfig = {
        firstHalf: { scoreRate: { "1-0": 0.5, "0-1": 0.5 } } as any,
        secondHalf: { scoreRate: { "0-0": 0.5, "1-1": 0.5 } } as any,
      } as MatchConfigType;
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
