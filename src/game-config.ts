import { RateConfig } from "./types";

export const appConfigs = {
  hostingPort: 5000,
  database: {
    url: "mongodb://localhost:27017",
    options: {
      dbName: "marble-football",
    },
  },
  agenda: {
    url: "mongodb://localhost:27017",
    authSource: "",
    dbName: "marble-football",
    collectionName: "soccer_marble_2005_jobs",
    replicaSet: "",
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-2005-Service",
    env: "DEV",
  },
  adminToken: "LzOumSOmeWqFckOSZV0dtPBwGF6LZJBudCT4EJRO0krYSOxhFAveG777lMfZw89F",
};

export const gameSettings = {
  gameId: 2005,
  modelPrefix: "soccer_marble_2005",
  upcomingEvents: 3,
  theme: "epl_mun",
  gameTiming: {
    wholeRound: 140,
    timelines: [
      {
        OddsAvailable: 0,
        ScheduleStart: 30,
        ResultAvailable: 70,
      },
      {
        OddsAvailable: 65,
        ScheduleStart: 100,
        ResultAvailable: 140,
      },
    ],
  },
  teams: [
    "nt_arg",
    "nt_esp",
    "nt_fra",
    "nt_eng",
    "nt_bra",
    "nt_ned",
    "nt_por",
    "nt_ger",
    "clb_rma",
    "clb_mci",
    "clb_fcb",
    "clb_liv",
    "clb_che",
    "clb_int",
    "clb_bar",
    "clb_ars",
  ],
  numberOfVideos: {
    AAAA: 11,
    AAAH: 12,
    AAA: 48,
    AAHA: 12,
    AAHH: 11,
    AAH: 25,
    AA: 92,
    AHAA: 12,
    AHAH: 11,
    AHA: 25,
    AHHA: 11,
    AHHH: 12,
    AHH: 25,
    AH: 94,
    A: 131,
    HAAA: 12,
    HAAH: 11,
    HAA: 25,
    HAHA: 11,
    HAHH: 12,
    HAH: 25,
    HA: 91,
    HHAA: 11,
    HHAH: 12,
    HHA: 25,
    HHHA: 12,
    HHHH: 11,
    HHH: 47,
    HH: 85,
    H: 131,
  } as Record<string, number>,
};

const halfConfig1: RateConfig = {
  scoreRate: {
    "1-0": 0.1072,
    "0-1": 0.1223,
    "1-1": 0.147,
    "2-0": 0.0475,
    "0-2": 0.1159,
    "2-1": 0.0656,
    "1-2": 0.1188,
    "3-0": 0.0121,
    "0-3": 0.0721,
    "2-2": 0.058,
    "3-1": 0.0298,
    "1-3": 0.0734,
    "4-0": 0.0111,
    "0-4": 0.0192,
  },
};

const halfConfig2: RateConfig = {
  scoreRate: {
    "1-0": 0.0853,
    "0-1": 0.1189,
    "1-1": 0.1353,
    "2-0": 0.0403,
    "0-2": 0.1213,
    "2-1": 0.0773,
    "1-2": 0.1258,
    "3-0": 0.0112,
    "0-3": 0.0714,
    "2-2": 0.0669,
    "3-1": 0.0338,
    "1-3": 0.0786,
    "4-0": 0.0116,
    "0-4": 0.0223,
  },
};

const halfConfig3: RateConfig = {
  scoreRate: {
    "1-0": 0.082,
    "0-1": 0.1051,
    "1-1": 0.1342,
    "2-0": 0.0274,
    "0-2": 0.0901,
    "2-1": 0.0724,
    "1-2": 0.1553,
    "3-0": 0.0135,
    "0-3": 0.0748,
    "2-2": 0.0897,
    "3-1": 0.0364,
    "1-3": 0.0841,
    "4-0": 0.0135,
    "0-4": 0.0215,
  },
};

const halfConfig4: RateConfig = {
  scoreRate: {
    "1-0": 0.1223,
    "0-1": 0.1072,
    "1-1": 0.147,
    "2-0": 0.1159,
    "0-2": 0.0475,
    "2-1": 0.1188,
    "1-2": 0.0656,
    "3-0": 0.0721,
    "0-3": 0.0121,
    "2-2": 0.058,
    "3-1": 0.0734,
    "1-3": 0.0298,
    "4-0": 0.0192,
    "0-4": 0.0111,
  },
};

const halfConfig5: RateConfig = {
  scoreRate: {
    "1-0": 0.1189,
    "0-1": 0.0853,
    "1-1": 0.1353,
    "2-0": 0.1213,
    "0-2": 0.0403,
    "2-1": 0.1258,
    "1-2": 0.0773,
    "3-0": 0.0714,
    "0-3": 0.0112,
    "2-2": 0.0669,
    "3-1": 0.0786,
    "1-3": 0.0338,
    "4-0": 0.0223,
    "0-4": 0.0116,
  },
};

const halfConfig6: RateConfig = {
  scoreRate: {
    "1-0": 0.1051,
    "0-1": 0.082,
    "1-1": 0.1342,
    "2-0": 0.0901,
    "0-2": 0.0274,
    "2-1": 0.1553,
    "1-2": 0.0724,
    "3-0": 0.0748,
    "0-3": 0.0135,
    "2-2": 0.0897,
    "3-1": 0.0841,
    "1-3": 0.0364,
    "4-0": 0.0215,
    "0-4": 0.0135,
  },
};

const rateConfigsAwayFavorite = [halfConfig1, halfConfig2, halfConfig3];

const rateConfigsHomeFavorite = [halfConfig4, halfConfig5, halfConfig6];

export const rateConfigs = {
  awayFavorite: rateConfigsAwayFavorite,
  homeFavorite: rateConfigsHomeFavorite,
};
