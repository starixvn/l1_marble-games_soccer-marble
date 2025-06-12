export default {
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
    replicaSet: "SP-UAT",
  },
  sentry: {
    sentryUrl: "http://9046cc701dad8bd271f2256cc4f0329a@sentryuat-sc.nebula.prod/17",
    logIdentifier: "Soccer-Marble-Service",
    env: "UAT",
  },
  adminToken: "3AsbupPJx4HcB6SOhUdqr7lzFhxE8Y82sCFio0mZi19Lha7WDIA4ASPLgdorOp7G",
};
