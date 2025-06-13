import mongoose, { Schema } from "mongoose";
import { GameConfig } from "../types";

const GameConfigSchema = new Schema<GameConfig>({
  gameId: { type: Number, required: true },
  config: { type: Object, required: true },
});

export default mongoose.model<GameConfig>("game_configs", GameConfigSchema);
