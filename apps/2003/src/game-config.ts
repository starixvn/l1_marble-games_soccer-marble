export const appConfigs = {
  hostingPort: 5000,
  database: {
    url: process.env.NODE_ENV === "production" ? "mongodb://host.docker.internal:27017" : "mongodb://localhost:27017",
    options: {
      dbName: "marble-football",
    },
  },
  agenda: {
    url: process.env.NODE_ENV === "production" ? "mongodb://host.docker.internal:27017" : "mongodb://localhost:27017",
    authSource: "",
    dbName: "marble-football",
    collectionName: "soccer_marble_2003_jobs",
    replicaSet: "",
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-2003-Service",
    env: "DEV",
  },
};

export const gameSettings = {
  gameId: 2003,
  modelPrefix: "soccer_marble_2003",
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
