export const appConfigs = {
  hostingPort: 3000,
  database: {
    url: "mongodb://marble_backend:MarbleBackend%4022027@10.99.99.53:39520,10.99.99.54:39520,10.99.99.188:39520,10.99.99.187:39520/?authSource=admin&replicaSet=SP-UAT",
    options: {
      dbName: "marble_odds_feed",
    },
  },
  agenda: {
    url: "mongodb://marble_backend:MarbleBackend%4022027@10.99.99.53:39520,10.99.99.54:39520,10.99.99.188:39520,10.99.99.187:39520",
    authSource: "admin",
    dbName: "marble_odds_feed",
    collectionName: "soccer_marble_2002_jobs",
    replicaSet: "SP-UAT",
  },
  sentry: {
    sentryUrl: "http://9046cc701dad8bd271f2256cc4f0329a@sentryuat-sc.nebula.prod/17",
    logIdentifier: "Soccer-Marble-2002-Service",
    env: "UAT",
  },
};

export const gameSettings = {
  gameId: 2002,
  modelPrefix: "soccer_marble_2002",
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
const halfConfig1 = {
  scoreRate: {
    "1-0": 0.1074,
    "0-1": 0.1118,
    "1-1": 0.1688,
    "2-0": 0.0496,
    "0-2": 0.1502,
    "2-1": 0.075,
    "1-2": 0.097,
    "3-0": 0.0194,
    "0-3": 0.0632,
    "2-2": 0.0389,
    "3-1": 0.0254,
    "1-3": 0.0638,
    "4-0": 0.0093,
    "0-4": 0.0202,
  },
};

const halfConfig2 = {
  scoreRate: {
    "1-0": 0.0874,
    "0-1": 0.1197,
    "1-1": 0.1394,
    "2-0": 0.0428,
    "0-2": 0.1239,
    "2-1": 0.0737,
    "1-2": 0.1232,
    "3-0": 0.0106,
    "0-3": 0.0719,
    "2-2": 0.0642,
    "3-1": 0.0327,
    "1-3": 0.0781,
    "4-0": 0.0114,
    "0-4": 0.021,
  },
};

const halfConfig3 = {
  scoreRate: {
    "1-0": 0.0674,
    "0-1": 0.1376,
    "1-1": 0.11,
    "2-0": 0.036,
    "0-2": 0.0976,
    "2-1": 0.0724,
    "1-2": 0.1494,
    "3-0": 0.0218,
    "0-3": 0.0706,
    "2-2": 0.0795,
    "3-1": 0.03,
    "1-3": 0.0924,
    "4-0": 0.0135,
    "0-4": 0.0218,
  },
};

const halfConfig4 = {
  scoreRate: {
    "1-0": 0.1118,
    "0-1": 0.1074,
    "1-1": 0.1688,
    "2-0": 0.1502,
    "0-2": 0.0496,
    "2-1": 0.097,
    "1-2": 0.075,
    "3-0": 0.0632,
    "0-3": 0.0194,
    "2-2": 0.0389,
    "3-1": 0.0638,
    "1-3": 0.0254,
    "4-0": 0.0202,
    "0-4": 0.0093,
  },
};

const halfConfig5 = {
  scoreRate: {
    "1-0": 0.1197,
    "0-1": 0.0874,
    "1-1": 0.1394,
    "2-0": 0.1239,
    "0-2": 0.0428,
    "2-1": 0.1232,
    "1-2": 0.0737,
    "3-0": 0.0719,
    "0-3": 0.0106,
    "2-2": 0.0642,
    "3-1": 0.0781,
    "1-3": 0.0327,
    "4-0": 0.021,
    "0-4": 0.0114,
  },
};

const halfConfig6 = {
  scoreRate: {
    "1-0": 0.1376,
    "0-1": 0.0674,
    "1-1": 0.11,
    "2-0": 0.0976,
    "0-2": 0.036,
    "2-1": 0.1494,
    "1-2": 0.0724,
    "3-0": 0.0706,
    "0-3": 0.0218,
    "2-2": 0.0795,
    "3-1": 0.0924,
    "1-3": 0.03,
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
