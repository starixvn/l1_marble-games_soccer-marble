export default {
  hostingPort: 3000,
  database: {
    url: "mongodb://marble_backend:hONLdHsFt~fqGfC%3FL6*iwUexW*Q%60KeKF@10.99.99.53:39510,10.99.99.54:39510,10.99.99.188:39510,10.99.99.187:39510/?authSource=admin&replicaSet=SP-Main",
    options: {
      dbName: "marble_odds_feed",
    },
  },
  sentry: {
    sentryUrl: "http://18c14f2b9e99e35084c50110359e1592@sentrypro-sc.nebula.prod/16",
    logIdentifier: "Soccer-Marble-Service",
    env: "PROD",
  },
  adminToken: "Q1ePtW0DtXzPuGAqF85Q1kdcB6LAuU9V91PfybReWS56OJJkIwHfkr0LhpQtaTZo",
};
