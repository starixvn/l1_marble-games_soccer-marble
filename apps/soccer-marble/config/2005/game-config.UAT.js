export const appConfigs = {
  hostingPort: 3000,
  database: {
    url: "mongodb://marble_backend:MarbleBackend%4022027@10.146.34.28:39520/?authSource=admin&replicaSet=SP-UAT",
    options: {
      dbName: "marble_odds_feed",
    },
  },
  agenda: {
    url: "mongodb://marble_backend:MarbleBackend%4022027@10.146.34.28:39520",
    authSource: "admin",
    dbName: "marble_odds_feed",
    collectionName: "soccer_marble_2005_jobs",
    replicaSet: "SP-UAT",
  },
  sentry: {
    sentryUrl: "http://9046cc701dad8bd271f2256cc4f0329a@sentryuat-sc.nebula.prod/17",
    logIdentifier: "Soccer-Marble-2005-Service",
    env: "UAT",
  },
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
    "clb_ars",
    "clb_avl",
    "clb_bou",
    "clb_bre",
    "clb_bha",
    "clb_bur",
    "clb_che",
    "clb_cry",
    "clb_eve",
    "clb_ful",
    "clb_lee",
    "clb_liv",
    "clb_mci",
    "clb_mun",
    "clb_new",
    "clb_nfo",
    "clb_sun",
    "clb_tot",
    "clb_whu",
    "clb_wol",
  ],
  numberOfVideos: {
    AHAH: 10,
    H: 147,
    A: 148,
    AH: 106,
    HA: 91,
    AA: 92,
    HH: 85,
    AAH: 25,
    AAA: 48,
    AHH: 26,
    AHA: 25,
    HHH: 47,
    HHA: 25,
    HAH: 26,
    HAA: 25,
    HAHH: 12,
    AHHH: 12,
    HAAA: 12,
    AAAH: 12,
    HHHA: 12,
    AAHA: 12,
    AHAA: 12,
    HAAH: 11,
    HHAH: 12,
    AAHH: 11,
    AHHA: 11,
    HAHA: 11,
    HHAA: 11,
    HHHH: 11,
    AAAA: 11,
  },
};

const halfConfig1 = {
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

const halfConfig2 = {
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

const halfConfig3 = {
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

const halfConfig4 = {
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

const halfConfig5 = {
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

const halfConfig6 = {
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
