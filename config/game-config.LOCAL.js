export default {
  hostingPort: 3000,
  database: {
    url: "mongodb://service:S3rv1c3@10.10.50.14:8708/?replicaSet=BotsRS&authSource=admin&tls=false",
    options: {
      dbName: "marble_odds_feed",
    },
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-Service",
    env: "LOCAL",
  },
};
