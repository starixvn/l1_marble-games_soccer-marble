import {
  DrawResultType,
  MatchConfigType,
  RateConfig,
  RoundSettlementResultType,
  Timeline,
} from "@soccer-marble/soccer-marble-base";

export type MatchConfigsDetailType = {
  firstHalfMatchConfigs: MatchConfigType[];
  secondHalfMatchConfigs: MatchConfigType[];
};

export type GameRunningRound = {
  roundId: number;
  roundTime: number;
  homeTeam: string;
  awayTeam: string;
  theme: string;
  matchConfig: MatchConfigType;
  matchConfigsDetail: MatchConfigsDetailType;
  selections: Record<string, Selection>[];
  odds: Record<string, number>[];
  result: RoundResultType;
  settlementResult: RoundSettlementResultType;
  eventID: number;
  gameId: number;
  ended: boolean;
  encryptedResult: any;
  encryptedSettlementResult: any;
  encryptedSelections: any;
};

export type RoundResultType = {
  drawResults: DrawResultType[];
  firstHalfResults: DrawResultType[];
  secondHalfResults: DrawResultType[];
};

export type GameTiming = {
  timelines: Timeline[];
  wholeRound: number;
  videoLength: number;
  oddsLength: number;
  resultLength: number;
  halfTime: number;
  breakTime: number;
};

export type HalfConfigType = RateConfig & {
  overUnderValue: number;
  handicapValue: number;
  homeOverUnderValue: number;
  awayOverUnderValue: number;
  numberOfEventDetails: number;
  eventDetailScoreRates: RateConfig[];
};
