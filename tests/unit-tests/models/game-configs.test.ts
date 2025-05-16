import mongoose from "mongoose";
import GameConfigModel from "../../../src/models/game-configs";

describe("Game Config Model", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/test");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await GameConfigModel.deleteMany({});
  });

  it("should create a game config successfully", async () => {
    const gameConfig = new GameConfigModel({
      gameId: 1,
      enabled: true,
    });

    const savedGameConfig = await gameConfig.save();
    expect(savedGameConfig._id).toBeDefined();
    expect(savedGameConfig.gameId).toBe(1);
    expect(savedGameConfig.enabled).toBe(true);
  });

  it("should fail to create a game config without required fields", async () => {
    const gameConfig = new GameConfigModel({});

    await expect(gameConfig.save()).rejects.toThrow();
  });

  it("should fail to create a game config with invalid gameId type", async () => {
    const gameConfig = new GameConfigModel({
      gameId: "invalid",
      enabled: true,
    });

    await expect(gameConfig.save()).rejects.toThrow();
  });

  it("should fail to create a game config with invalid enabled type", async () => {
    const gameConfig = new GameConfigModel({
      gameId: 1,
      enabled: "invalid",
    });

    await expect(gameConfig.save()).rejects.toThrow();
  });
});
