const { createBaseJestConfig } = require("./jest.config.base.js");

module.exports = async () => {
  return createBaseJestConfig();
};
