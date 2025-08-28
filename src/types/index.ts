import { logger } from "sc-common";
import { EventDetailModel, EventModel, GameConfigModel, RoundModel } from "../models";
import { appConfigs, rateConfigs } from "../game-config";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { RoundGeneratorService } from "../services/round-generator-service";
import { GameConfigService } from "../services/game-config-service";
import { GameHandler } from "../crons/game-handler";
import Agenda from "agenda";
import { Scheduler } from "../crons/scheduler";
import { Consumer } from "../crons/consumer";
import { GameData } from "../crons/game-data";

export type RateConfig = {
  scoreRate: Record<string, number>;
};

export type HalfConfigType = RateConfig & {
  overUnderValue: number;
  handicapValue: number;
  homeOverUnderValue: number;
  awayOverUnderValue: number;
  numberOfEventDetails: number;
  eventDetailScoreRates: RateConfig[];
};

export type MatchConfigType = {
  timelines: Timeline[];
  firstHalf: HalfConfigType;
  secondHalf: HalfConfigType;
  overUnderValue: number;
  handicapValue: number;
  homeOverUnderValue: number;
  awayOverUnderValue: number;
};

export enum SettlementStatus {
  PLAY = "P",
  LOSE = "L",
  WIN = "W",
  DRAW = "D",
}

export type Selection = {
  name: string;
  price: number;
  point: number;
  settlementStatus: SettlementStatus;
};

export type EventDetail = {
  eventID: number;
  oddsAvailableTs: Date;
  scheduleStartTs: Date;
  resultsAvailableTs: Date;
  playlist?: string;
  goalInfo?: string;
  selections?: Selection[];
  result?: {
    goalSequence: string;
    finalScore: string;
  };
  hasResults: boolean;
  phase: number;
};

export type DrawResultType = {
  playlist: string;
  goalInfo?: string;
  result: {
    goalSequence: string;
    finalScore: string;
  };
};

export type RoundResultType = {
  drawResults: DrawResultType[];
  firstHalfResults: DrawResultType[];
  secondHalfResults: DrawResultType[];
};

export type DrawSettlementResultType = Record<string, SettlementStatus>;
export type RoundSettlementResultType = DrawSettlementResultType[];

export type Event = {
  eventID: number;
  eventNameAKey: string;
  eventNameBKey: string;
  gameId: number;
  eventDetails: EventDetail[];
  scheduleStartTs: Date;
};

export interface AppContainer {
  appConfigs: typeof appConfigs;
  logService: typeof logger;
  gameSettings: GameSettings;
  rateConfigs: typeof rateConfigs;
  eventDetailsRepository: typeof EventDetailModel;
  eventRepository: typeof EventModel;
  roundRepository: typeof RoundModel;
  gameConfigRepository: typeof GameConfigModel;
  roundGeneratorService: RoundGeneratorService;
  roundService: RoundService;
  eventService: EventService;
  gameConfigService: GameConfigService;
  gameHandler: GameHandler;
  agenda: Agenda;
  scheduler: Scheduler;
  consumer: Consumer;
  gameData: GameData;
}

export type GameSettings = {
  gameId: number;
  theme: string;
  upcomingEvents: number;
  gameTiming: GameTiming;
  teams: string[];
  numberOfVideos: Record<string, number>;
};

export type GameTiming = {
  wholeRound: number;
  videoLength: number;
  oddsLength: number;
  resultLength: number;
  timelines: Array<Timeline>;
  halfTime: number;
  breakTime: number;
};

export type Timeline = {
  [key in Phase]: number;
};

export enum Phase {
  OddsAvailable = "OddsAvailable",
  ScheduleStart = "ScheduleStart",
  ResultAvailable = "ResultAvailable",
}

export type DataResultType = {
  numberOfVideos: Record<string, number>;
  matchConfig: MatchConfigType;
};

export type GameRunningRound = {
  roundId: number;
  roundTime: number;
  homeTeam: string;
  awayTeam: string;
  theme: string;
  matchConfig: MatchConfigType;
  oddsConfigs: {
    firstHalfMatchConfigs: MatchConfigType[];
    secondHalfMatchConfigs: MatchConfigType[];
  };
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

export type GameConfig = {
  gameId: number;
  config: ConfigData;
};

export type Match = {
  homeTeam: string;
  awayTeam: string;
  theme: string;
};

export type ConfigData = {
  enabled: boolean;
  teamSelectionMode: number;
  teams: string[];
  matches: Match[];
  numberOfVideos: Record<string, number>;
};

export enum JobName {
  ScheduleUpcomingEvent = "ScheduleUpcomingEvent",
  UpdateEventDetailOdds = "UpdateEventDetailOdds",
  UpdateEventDetailVideoInfo = "UpdateEventDetailVideoInfo",
  UpdateEventDetailResult = "UpdateEventDetailResult",
}

export enum FirstHalfOddsKey {
  H1_HDP_HOME = "h1_hdp_home",
  H1_HDP_AWAY = "h1_hdp_away",

  H1_1X2_HOME = "h1_1x2_home",
  H1_1X2_AWAY = "h1_1x2_away",
  H1_1X2_DRAW = "h1_1x2_draw",

  H1_OU_OVER = "h1_ou_over",
  H1_OU_UNDER = "h1_ou_under",

  H1_OE_ODD = "h1_oe_odd",
  H1_OE_EVEN = "h1_oe_even",

  H1_HOME_OVER = "h1_home_over",
  H1_HOME_UNDER = "h1_home_under",
  H1_AWAY_OVER = "h1_away_over",
  H1_AWAY_UNDER = "h1_away_under",

  FT_HDP_HOME = "ft_hdp_home",
  FT_HDP_AWAY = "ft_hdp_away",

  FT_1X2_HOME = "ft_1x2_home",
  FT_1X2_AWAY = "ft_1x2_away",
  FT_1X2_DRAW = "ft_1x2_draw",

  FT_OU_OVER = "ft_ou_over",
  FT_OU_UNDER = "ft_ou_under",

  FT_OE_ODD = "ft_oe_odd",
  FT_OE_EVEN = "ft_oe_even",

  FT_HOME_OVER = "ft_home_over",
  FT_HOME_UNDER = "ft_home_under",
  FT_AWAY_OVER = "ft_away_over",
  FT_AWAY_UNDER = "ft_away_under",
}

export enum SecondHalfOddsKey {
  FT_1X2_HOME = "ft_1x2_home",
  FT_1X2_AWAY = "ft_1x2_away",
  FT_1X2_DRAW = "ft_1x2_draw",

  FT_HDP_HOME = "ft_hdp_home",
  FT_HDP_AWAY = "ft_hdp_away",

  FT_OU_OVER = "ft_ou_over",
  FT_OU_UNDER = "ft_ou_under",

  FT_OE_ODD = "ft_oe_odd",
  FT_OE_EVEN = "ft_oe_even",

  FT_HOME_OVER = "ft_home_over",
  FT_HOME_UNDER = "ft_home_under",
  FT_AWAY_OVER = "ft_away_over",
  FT_AWAY_UNDER = "ft_away_under",
}
