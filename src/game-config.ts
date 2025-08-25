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
    collectionName: "soccer_marble_2004_jobs",
    replicaSet: "",
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-2004-Service",
    env: "DEV",
  },
  adminToken: "LzOumSOmeWqFckOSZV0dtPBwGF6LZJBudCT4EJRO0krYSOxhFAveG777lMfZw89F",
};

export const gameSettings = {
  gameId: 2004,
  modelPrefix: "soccer_marble_2004",
  upcomingEvents: 3,
  theme: "epl_mun",
  gameTiming: {
    wholeRound: 100,
    timelines: [],
    videoLength: 32,
    oddsLength: 10,
    halfTime: 20,
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
    "0": 1,
  } as Record<string, number>,
};

const config1: RateConfig = {
  scoreRate: {
    "1-0": 0.55,
    "0-1": 0.45,
  },
};

const config2: RateConfig = {
  scoreRate: {
    "1-0": 0.45,
    "0-1": 0.55,
  },
};

const config3: RateConfig = {
  scoreRate: {
    "1-0": 0.25,
    "0-1": 0.25,
    "0-0": 0.5,
  },
};

const config4: RateConfig = {
  scoreRate: {
    "1-0": 0.25,
    "0-1": 0.25,
    "0-0": 0.5,
  },
};

export const rateConfigs = {
  homeFavorite: [config1],
  homeFavoriteDraw: [config3],
  awayFavorite: [config2],
  awayFavoriteDraw: [config4],
};
