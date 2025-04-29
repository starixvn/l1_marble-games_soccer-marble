export default {
  hostingPort: 3000,
  database: {
    url: "mongodb://mongo:27017",
    options: {
      dbName: "marble-football-test-db",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      auto_reconnect: true,
    },
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-Service",
    env: "LOCAL",
  },
};
