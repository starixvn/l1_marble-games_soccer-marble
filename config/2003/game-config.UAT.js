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
    collectionName: "soccer_marble_2003_jobs",
    replicaSet: "SP-UAT",
  },
  sentry: {
    sentryUrl: "http://9046cc701dad8bd271f2256cc4f0329a@sentryuat-sc.nebula.prod/17",
    logIdentifier: "Soccer-Marble-2003-Service",
    env: "UAT",
  },
};

export const gameSettings = {
  gameId: 2003,
  modelPrefix: "soccer_marble_2003",
  upcomingEvents: 3,
  theme: "mun",
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
    "1-0": 0.1057,
    "0-1": 0.1165,
    "1-1": 0.1691,
    "2-0": 0.0548,
    "0-2": 0.1477,
    "2-1": 0.0658,
    "1-2": 0.0995,
    "3-0": 0.0152,
    "0-3": 0.0673,
    "2-2": 0.0409,
    "3-1": 0.0253,
    "1-3": 0.0642,
    "4-0": 0.0095,
    "0-4": 0.0185,
  },
};

const halfConfig2 = {
  scoreRate: {
    "1-0": 0.0857,
    "0-1": 0.1193,
    "1-1": 0.1363,
    "2-0": 0.0424,
    "0-2": 0.1218,
    "2-1": 0.0766,
    "1-2": 0.1253,
    "3-0": 0.0114,
    "0-3": 0.0715,
    "2-2": 0.0663,
    "3-1": 0.0336,
    "1-3": 0.0755,
    "4-0": 0.0115,
    "0-4": 0.0228,
  },
};

const halfConfig3 = {
  scoreRate: {
    "1-0": 0.0791,
    "0-1": 0.1276,
    "1-1": 0.1133,
    "2-0": 0.0292,
    "0-2": 0.1076,
    "2-1": 0.0724,
    "1-2": 0.1461,
    "3-0": 0.0151,
    "0-3": 0.0739,
    "2-2": 0.0796,
    "3-1": 0.0351,
    "1-3": 0.0857,
    "4-0": 0.0135,
    "0-4": 0.0218,
  },
};

const halfConfig4 = {
  scoreRate: {
    "1-0": 0.1165,
    "0-1": 0.1057,
    "1-1": 0.1691,
    "2-0": 0.1477,
    "0-2": 0.0548,
    "2-1": 0.0995,
    "1-2": 0.0658,
    "3-0": 0.0673,
    "0-3": 0.0152,
    "2-2": 0.0409,
    "3-1": 0.0642,
    "1-3": 0.0253,
    "4-0": 0.0185,
    "0-4": 0.0095,
  },
};

const halfConfig5 = {
  scoreRate: {
    "1-0": 0.1193,
    "0-1": 0.0857,
    "1-1": 0.1363,
    "2-0": 0.1218,
    "0-2": 0.0424,
    "2-1": 0.1253,
    "1-2": 0.0766,
    "3-0": 0.0715,
    "0-3": 0.0114,
    "2-2": 0.0663,
    "3-1": 0.0755,
    "1-3": 0.0336,
    "4-0": 0.0228,
    "0-4": 0.0115,
  },
};

const halfConfig6 = {
  scoreRate: {
    "1-0": 0.1276,
    "0-1": 0.0791,
    "1-1": 0.1133,
    "2-0": 0.1076,
    "0-2": 0.0292,
    "2-1": 0.1461,
    "1-2": 0.0724,
    "3-0": 0.0739,
    "0-3": 0.0151,
    "2-2": 0.0796,
    "3-1": 0.0857,
    "1-3": 0.0351,
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
