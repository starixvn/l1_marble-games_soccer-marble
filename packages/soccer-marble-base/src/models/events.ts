import mongoose, { Schema } from "mongoose";
import { SettlementStatus } from "../types";

export type EventConfig = {
  preloadDurationMs: number;
};
export interface IEvent {
  _id: mongoose.Schema.Types.ObjectId;
  eventID: number;
  eventNameAKey: string;
  eventNameBKey: string;
  theme: string;
  eventDetails: mongoose.Schema.Types.ObjectId[];
  gameId: number;
  scheduleStartTs: Date;
  scheduleEndTs: Date;
  eventConfig: EventConfig;
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
const EventSchema = new Schema<IEvent>({
  eventID: { type: Number, required: true, unique: true },
  eventNameAKey: { type: String, required: true },
  eventNameBKey: { type: String, required: true },
  theme: { type: String, required: true },
  gameId: { type: Number, required: true },
  eventDetails: [mongoose.Schema.Types.ObjectId],
  eventConfig: { type: Schema.Types.Mixed, required: true },
  scheduleStartTs: { type: Date, required: true },
  scheduleEndTs: { type: Date, required: true },
});

// Create and export the Event model
export default mongoose.model("events", EventSchema);
