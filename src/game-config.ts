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
    collectionName: "soccer_marble_jobs",
    replicaSet: "",
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-Service",
    env: "DEV",
  },
  adminToken: "LzOumSOmeWqFckOSZV0dtPBwGF6LZJBudCT4EJRO0krYSOxhFAveG777lMfZw89F",
};

export const gameSettings = {
  gameId: 2001,
  modelPrefix: "soccer_marble",
  upcomingEvents: 3,
  gameTiming: {
    wholeRound: 131,
    timelines: [
      {
        OddsAvailable: 1,
        ScheduleStart: 31,
        ResultAvailable: 71,
      },
      {
        OddsAvailable: 66,
        ScheduleStart: 91,
        ResultAvailable: 131,
      },
    ],
  },
  teams: [
    "clb_rma",
    "clb_mci",
    "clb_fcb",
    "clb_psg",
    "clb_che",
    "clb_int",
    "clb_juv",
    "clb_atm",
    "clb_bvb",
    "clb_ben",
    "clb_por",
    "clb_fla",
    "clb_riv",
    "clb_pal",
    "clb_boj",
    "clb_mon",
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
  },
};

const halfConfig1: RateConfig = {
  scoreRate: {
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
  },
};

const halfConfig2: RateConfig = {
  scoreRate: {
    "1-0": 0.0824,
    "0-1": 0.1176,
    "1-1": 0.1293,
    "2-0": 0.0353,
    "0-2": 0.1176,
    "2-1": 0.0824,
    "1-2": 0.1294,
    "3-0": 0.0118,
    "0-3": 0.0706,
    "2-2": 0.0706,
    "3-1": 0.0353,
    "1-3": 0.0824,
    "4-0": 0.0118,
    "0-4": 0.0235,
  },
};

const halfConfig3: RateConfig = {
  scoreRate: {
    "1-0": 0.1024,
    "0-1": 0.1076,
    "1-1": 0.12,
    "2-0": 0.0153,
    "0-2": 0.1276,
    "2-1": 0.0724,
    "1-2": 0.1394,
    "3-0": 0.0018,
    "0-3": 0.0806,
    "2-2": 0.0799,
    "3-1": 0.0453,
    "1-3": 0.0724,
    "4-0": 0.0135,
    "0-4": 0.0218,
  },
};

const halfConfig4: RateConfig = {
  scoreRate: {
    "1-0": 0.129,
    "0-1": 0.128,
    "1-1": 0.18,
    "2-0": 0.0844,
    "0-2": 0.0824,
    "2-1": 0.0749,
    "1-2": 0.0709,
    "3-0": 0.0426,
    "0-3": 0.0406,
    "2-2": 0.0628,
    "3-1": 0.0428,
    "1-3": 0.0408,
    "4-0": 0.0108,
    "0-4": 0.01,
  },
};

const halfConfig5: RateConfig = {
  scoreRate: {
    "1-0": 0.1176,
    "0-1": 0.0824,
    "1-1": 0.1293,
    "2-0": 0.1176,
    "0-2": 0.0353,
    "2-1": 0.1294,
    "1-2": 0.0824,
    "3-0": 0.0706,
    "0-3": 0.0118,
    "2-2": 0.0706,
    "3-1": 0.0824,
    "1-3": 0.0353,
    "4-0": 0.0235,
    "0-4": 0.0118,
  },
};

const halfConfig6: RateConfig = {
  scoreRate: {
    "1-0": 0.1076,
    "0-1": 0.1024,
    "1-1": 0.12,
    "2-0": 0.1276,
    "0-2": 0.0153,
    "2-1": 0.1394,
    "1-2": 0.0724,
    "3-0": 0.0806,
    "0-3": 0.0018,
    "2-2": 0.0799,
    "3-1": 0.0724,
    "1-3": 0.0453,
    "4-0": 0.0218,
    "0-4": 0.0135,
  },
};

const rateConfigsAwayFavorite = [halfConfig1, halfConfig2, halfConfig3];

const rateConfigsHomeFavorite = [halfConfig4, halfConfig5, halfConfig6];

export const rateConfigs = {
  awayFavorite: rateConfigsAwayFavorite,
  homeFavorite: rateConfigsHomeFavorite,
};
