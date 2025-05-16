import GameConfigModel from "../../../src/models/game-configs";

describe("Game Config Model", () => {
  it("should create model with default properties", () => {
    const gameConfig = new GameConfigModel({
      gameId: 1,
      enabled: true,
    });

    expect(gameConfig.gameId).toBe(1);
    expect(gameConfig.enabled).toBe(true);
  });

  it("should verify required properties", () => {
    const gameConfig = new GameConfigModel({});

    const validationError = gameConfig.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("gameId");
    expect(validationError?.errors).toHaveProperty("enabled");
  });

  it("should verify property types", () => {
    const gameConfig = new GameConfigModel({
      gameId: "invalid",
      enabled: "invalid",
    });

    const validationError = gameConfig.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toHaveProperty("gameId");
    expect(validationError?.errors).toHaveProperty("enabled");
  });
});
