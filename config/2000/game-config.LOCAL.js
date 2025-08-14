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
    collectionName: "soccer_marble_2000_jobs",
    replicaSet: "SPLocal0",
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-2000-Service",
    env: "LOCAL",
  },
};

export const gameSettings = {
  gameId: 2000,
  modelPrefix: "soccer_marble_2000",
  upcomingEvents: 3,
  theme: "2001",
  gameTiming: {
    wholeRound: 96,
    timelines: [
      {
        OddsAvailable: 0,
        ScheduleStart: 10,
        ResultAvailable: 43,
      },
      {
        OddsAvailable: 40,
        ScheduleStart: 53,
        ResultAvailable: 86,
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

const halfConfig1 = {
  scoreRate: {
    "1-0": 0.1024,
    "0-1": 0.1259,
    "1-1": 0.1696,
    "2-0": 0.0653,
    "0-2": 0.1426,
    "2-1": 0.0474,
    "1-2": 0.1044,
    "3-0": 0.0068,
    "0-3": 0.0756,
    "2-2": 0.045,
    "3-1": 0.025,
    "1-3": 0.065,
    "4-0": 0.01,
    "0-4": 0.015,
  },
};

const halfConfig2 = {
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

const halfConfig3 = {
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

const halfConfig4 = {
  scoreRate: {
    "1-0": 0.1259,
    "0-1": 0.1024,
    "1-1": 0.1696,
    "2-0": 0.1426,
    "0-2": 0.0653,
    "2-1": 0.1044,
    "1-2": 0.0474,
    "3-0": 0.0756,
    "0-3": 0.0068,
    "2-2": 0.045,
    "3-1": 0.065,
    "1-3": 0.025,
    "4-0": 0.015,
    "0-4": 0.01,
  },
};

const halfConfig5 = {
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

const halfConfig6 = {
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
