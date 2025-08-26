export const appConfigs = {
  hostingPort: 3000,
  database: {
    url: "mongodb://marble_backend:MarbleBackend@10.10.50.12:39400,10.10.50.13:39400,10.10.50.14:39400/?replicaSet=SPLocal0",
    options: {
      dbName: "marble_odds_feed",
    },
  },
  agenda: {
    url: "mongodb://marble_backend:MarbleBackend@10.10.50.12:39400,10.10.50.13:39400,10.10.50.14:39400",
    authSource: "admin",
    dbName: "marble_odds_feed",
    collectionName: "soccer_marble_2004_jobs",
    replicaSet: "SPLocal0",
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-2004-Service",
    env: "LOCAL",
  },
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
    A: 29,
    H: 29,
    0: 1,
  },
};

const config1 = {
  scoreRate: {
    "1-0": 0.55,
    "0-1": 0.45,
  },
};

const config2 = {
  scoreRate: {
    "1-0": 0.45,
    "0-1": 0.55,
  },
};

const config3 = {
  scoreRate: {
    "1-0": 0.25,
    "0-1": 0.25,
    "0-0": 0.5,
  },
};

const config4 = {
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
