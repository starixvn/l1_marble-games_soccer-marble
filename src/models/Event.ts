import mongoose, { Schema } from "mongoose";
import { Event } from "../types";

// Define the Selection Schema
const SelectionSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    settlementStatus: {
      type: String,
      enum: ["Play", "Lose", "Win", "Draw"],
      default: "Play",
    },
  },
  { _id: false }
);

// Define the EventDetail Schema
const EventDetailSchema = new Schema(
  {
    scheduleStartTs: { type: Date, required: true },
    resultsAvailableTs: { type: Date, required: true },
    playlist: { type: String },
    goalInfo: { type: String },
    selections: [SelectionSchema],
    result: { type: Schema.Types.Mixed },
    encryptedResult: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

// Define the Event Schema
const EventSchema = new Schema(
  {
    eventID: { type: Number, required: true },
    eventNameAKey: { type: String, required: true },
    eventNameBKey: { type: String, required: true },
    gameId: { type: Number, required: true },
    eventDetails: [EventDetailSchema],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// Create and export the Event model
export default mongoose.model<Event>("Event", EventSchema);
