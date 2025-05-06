import mongoose, { Schema } from "mongoose";
import { EventDetailSchema } from "./event-details";
import { Event, MatchConfigType } from "../types";

export interface IRound extends Event {
  _id: mongoose.Schema.Types.ObjectId;
  roundId: number;
  ended: boolean;
  matchConfig: MatchConfigType;
  encryptedEventDetails: any[];
}

const RoundSchema = new Schema<IRound>({
  roundId: { type: Number, required: true },
  eventID: { type: Number, required: true },
  gameId: { type: Number, required: true },
  eventNameAKey: { type: String, required: true },
  eventNameBKey: { type: String, required: true },
  eventDetails: [EventDetailSchema],
  encryptedEventDetails: [{ type: Schema.Types.Mixed }],
  scheduleStartTs: { type: Date, required: true },
  scheduleEndTs: { type: Date, required: true },
  ended: { type: Boolean, required: true },
  matchConfig: { type: Schema.Types.Mixed },
});

export default mongoose.model<IRound>("soccer_marble_rounds", RoundSchema);
