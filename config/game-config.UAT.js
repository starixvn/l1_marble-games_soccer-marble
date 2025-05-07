export default {
  hostingPort: 3000,
  database: {
    url: "mongodb://marble_backend:MarbleBackend%4022027@10.99.99.53:39520,10.99.99.54:39520,10.99.99.188:39520,10.99.99.187:39520/?authSource=admin&replicaSet=SP-UAT",
    options: {
      dbName: "marble_odds_feed",
    },
  },
  sentry: {
    sentryUrl: "https://9046cc701dad8bd271f2256cc4f0329a@sentry-k8s.sgamesuat.com/17",
    logIdentifier: "Soccer-Marble-Service",
    env: "UAT",
  },
};
