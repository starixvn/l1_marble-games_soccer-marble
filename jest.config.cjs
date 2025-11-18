const { createBaseJestConfig } = require("./jest.config.base.js");

module.exports = async () => {
  const baseConfig = createBaseJestConfig();

  return {
    ...baseConfig,
    // Only run tests in the root tests/ directory
    testMatch: ["<rootDir>/tests/**/*.test.ts"],
    // Exclude workspace tests
    testPathIgnorePatterns: ["/node_modules/", "/apps/", "/packages/"],
    // Override ts-jest config to use tsconfig.test.json
    transform: {
      ...baseConfig.transform,
      "^.+\\.ts?$": [
        "ts-jest",
        {
          tsconfig: "tsconfig.test.json",
          useESM: true,
        },
      ],
    },
  };
};
