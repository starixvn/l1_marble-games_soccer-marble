function createBaseJestConfig(options = {}) {
  const { rootDir = "./", moduleNameMapper = {}, collectCoverageFrom = [], transformIgnorePatterns = [] } = options;

  return {
    rootDir,
    verbose: false,
    transform: {
      "^.+\\.ts?$": [
        "ts-jest",
        {
          useESM: true,
        },
      ],
      "^.+\\.js?$": [
        "babel-jest",
        {
          presets: [["@babel/preset-env", { targets: { node: "current" } }]],
        },
      ],
    },
    transformIgnorePatterns: ["node_modules/(?!(sc-common|@soccer-marble)/)", ...transformIgnorePatterns],
    moduleNameMapper: moduleNameMapper,
    preset: "ts-jest",
    testEnvironment: "node",
    testResultsProcessor: "jest-sonar-reporter",
    reporters: ["default", ["jest-junit", { outputDirectory: "coverage", outputName: "unit-tests.xml" }]],
    coverageReporters: ["clover", "lcov", "text-summary", "cobertura"],
    coverageDirectory: "coverage",
    collectCoverageFrom: [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!**/node_modules/**",
      "!**/vendor/**",
      "!**/tests/**",
      ...collectCoverageFrom,
    ],
    extensionsToTreatAsEsm: [".ts"],
  };
}

module.exports = {
  createBaseJestConfig,
};
