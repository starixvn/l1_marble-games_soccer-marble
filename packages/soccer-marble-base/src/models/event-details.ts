import mongoose, { Schema } from "mongoose";
import { SelectionSchema } from "./events";
import { EventDetail } from "../types";

export interface IEventDetail extends EventDetail {
  _id: mongoose.Schema.Types.ObjectId;
}

// Define the EventDetail Schema
export const EventDetailSchema = new Schema<IEventDetail>({
  eventID: { type: Number, required: true },
  oddsAvailableTs: { type: Date, required: true },
  scheduleStartTs: { type: Date, required: true },
  resultsAvailableTs: { type: Date, required: true },
  playlist: { type: String },
  goalInfo: { type: String },
  selections: [SelectionSchema],
  result: { type: Schema.Types.Mixed },
  hasResults: { type: Boolean, default: false },
  phase: { type: Number, required: true },
});

export default mongoose.model("event_details", EventDetailSchema);
