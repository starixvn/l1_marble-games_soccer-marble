export default {
  hostingPort: 5000,
  database: {
    url: "mongodb://localhost:27017",
    options: {
      dbName: "marble-football",
    },
  },
  sentry: {
    sentryUrl: "https://6b0f71afab190ba976d8bdc7a43969fe@sentry-k8s.lumigame.com/15",
    logIdentifier: "Soccer-Marble-Service",
    env: "DEV",
  },
};
