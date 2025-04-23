import mongoose, { Schema } from "mongoose";
import { SettlementStatus } from "../types";

export interface IEvent {
  _id: mongoose.Schema.Types.ObjectId;
  eventID: number;
  eventNameAKey: string;
  eventNameBKey: string;
  eventDetails: mongoose.Schema.Types.ObjectId[];
  gameId: number;
  startTime: Date;
  endTime: Date;
}

// Define the Selection Schema
export const SelectionSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    point: { type: Number, required: false, default: 0 },
    settlementStatus: {
      type: String,
      enum: SettlementStatus,
      default: SettlementStatus.PLAY,
    },
  },
  { _id: false }
);

// Define the Event Schema
const EventSchema = new Schema<IEvent>(
  {
    eventID: { type: Number, required: true },
    eventNameAKey: { type: String, required: true },
    eventNameBKey: { type: String, required: true },
    gameId: { type: Number, required: true },
    eventDetails: [mongoose.Schema.Types.ObjectId],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// Create and export the Event model
export default mongoose.model("marble_events", EventSchema);
