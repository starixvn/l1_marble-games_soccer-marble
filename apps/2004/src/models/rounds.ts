import mongoose, { Schema } from "mongoose";
import { GameRunningRound } from "../types";
import { gameSettings } from "../game-config";

export interface IRound extends GameRunningRound {
  _id: mongoose.Schema.Types.ObjectId;
}

const RoundSchema = new Schema<IRound>({
  roundId: { type: Number, required: true, unique: true },
  eventID: { type: Number, required: true, unique: true },
  gameId: { type: Number, required: true },
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  theme: { type: String, required: true },
  selections: [{ type: Schema.Types.Mixed }],
  odds: [{ type: Schema.Types.Mixed }],
  result: { type: Schema.Types.Mixed },
  settlementResult: [{ type: Schema.Types.Mixed }],
  ended: { type: Boolean, default: false },
  matchConfig: { type: Schema.Types.Mixed },
  matchConfigsDetail: { type: Schema.Types.Mixed },
  encryptedResult: { type: Schema.Types.Mixed },
  encryptedSettlementResult: { type: Schema.Types.Mixed },
  encryptedSelections: { type: Schema.Types.Mixed },
});

export default mongoose.model<IRound>(`${gameSettings.modelPrefix}_rounds`, RoundSchema);
