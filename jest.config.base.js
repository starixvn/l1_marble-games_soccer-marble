/**
 * Creates a base Jest configuration
 * @param {Object} options - Configuration options
 * @param {string} options.rootDir - Root directory for the package
 * @param {Object} options.moduleNameMapper - Additional module name mappings
 * @param {Array} options.collectCoverageFrom - Additional coverage collection patterns
 * @param {Object} options.transformIgnorePatterns - Additional transform ignore patterns
 * @returns {Object} Jest configuration object
 */
function createBaseJestConfig(options = {}) {
  const { rootDir = "./", moduleNameMapper = {}, collectCoverageFrom = [], transformIgnorePatterns = [] } = options;

  // Common transform ignore patterns for all packages
  const commonTransformIgnorePatterns = ["node_modules/(?!(sc-common|@soccer-marble)/)"];

  // Common coverage collection patterns
  const commonCollectCoverageFrom = [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/tests/**",
  ];

  // Common module name mappings for shared packages
  const commonModuleNameMapper = {
    "^@soccer-marble/soccer-marble-live$": "<rootDir>/../../packages/soccer-marble-live/src/index.ts",
    "^@soccer-marble/soccer-marble-base$": "<rootDir>/../../packages/soccer-marble-base/src/index.ts",
    "^@soccer-marble/shared-utils$": "<rootDir>/../../packages/shared-utils/src/index.ts",
  };

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
    transformIgnorePatterns: [...commonTransformIgnorePatterns, ...transformIgnorePatterns],
    moduleNameMapper: {
      ...commonModuleNameMapper,
      ...moduleNameMapper,
    },
    preset: "ts-jest",
    testEnvironment: "node",
    testResultsProcessor: "jest-sonar-reporter",
    reporters: ["default", ["jest-junit", { outputDirectory: "coverage", outputName: "unit-tests.xml" }]],
    coverageReporters: ["clover", "lcov", "text-summary", "cobertura"],
    coverageDirectory: "coverage",
    collectCoverageFrom: [...commonCollectCoverageFrom, ...collectCoverageFrom],
    // Handle ES modules in node_modules
    extensionsToTreatAsEsm: [".ts"],
  };
}

module.exports = {
  createBaseJestConfig,
};
