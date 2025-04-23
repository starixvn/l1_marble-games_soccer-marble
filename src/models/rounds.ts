import mongoose, { Schema } from "mongoose";
import { EventDetailSchema } from "./event-details";
import { Event } from "../types";

export interface IRound extends Event {
  _id: mongoose.Schema.Types.ObjectId;
  roundId: number;
}

const RoundSchema = new Schema<IRound>(
  {
    roundId: { type: Number, required: true },
    eventID: { type: Number, required: true },
    gameId: { type: Number, required: true },
    eventNameAKey: { type: String, required: true },
    eventNameBKey: { type: String, required: true },
    eventDetails: [EventDetailSchema],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRound>("soccer_marble_rounds", RoundSchema);
