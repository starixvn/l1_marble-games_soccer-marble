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
    collectionName: "soccer_marble_2000_jobs",
    replicaSet: "SP-UAT",
  },
  sentry: {
    sentryUrl: "http://9046cc701dad8bd271f2256cc4f0329a@sentryuat-sc.nebula.prod/17",
    logIdentifier: "Soccer-Marble-2000-Service",
    env: "UAT",
  },
};
