import moment from "moment";
import EventModel from "../models/Event";
import { gameConfig } from "../config";
import { generateTeamNames, generateEventDetails, generateSelections, decryptData } from "../utils";
import { Event, EventDetail, Selection, SettlementStatus } from "../types";

class EventService {
  /**
   * Generate new events
   * @returns Promise with generated events
   */
  async generateEvents(): Promise<Event[]> {
    try {
      // Get the last event ID to ensure sequential IDs
      const lastEvent = await EventModel.findOne().sort({ eventID: -1 });
      let lastEventId = lastEvent ? lastEvent.eventID : 0;

      const now = new Date();
      const events: Event[] = [];

      // Generate the specified number of events
      for (let i = 0; i < gameConfig.eventsPerGeneration; i++) {
        // Calculate start time for this event
        // Each event starts after the previous one ends
        const startTime = moment(now)
          .add(i * (gameConfig.gameHalfDurationSeconds * 2 + gameConfig.breakDurationSeconds), "seconds")
          .toDate();

        // Calculate end time
        const endTime = moment(startTime)
          .add(gameConfig.gameHalfDurationSeconds * 2 + gameConfig.breakDurationSeconds, "seconds")
          .toDate();

        // Generate team names
        const { home, away } = generateTeamNames();

        // Generate event details (two halves)
        const eventDetails = generateEventDetails(
          startTime,
          gameConfig.gameHalfDurationSeconds,
          gameConfig.breakDurationSeconds
        );

        // Create and save the new event
        const newEvent = new EventModel({
          eventID: ++lastEventId,
          eventNameAKey: home,
          eventNameBKey: away,
          gameId: Math.floor(Math.random() * 1000) + 1, // Random game ID
          eventDetails,
          startTime,
          endTime,
        });

        await newEvent.save();
        events.push(newEvent);
      }

      return events;
    } catch (error) {
      console.error("Error generating events:", error);
      throw error;
    }
  }

  /**
   * Check if we need to generate new events
   * @returns Promise with boolean indicating if new events are needed
   */
  async checkNeedForNewEvents(): Promise<boolean> {
    try {
      // Get current time
      const now = new Date();

      // Calculate the end time of the generation interval
      const endTime = moment(now).add(gameConfig.generationIntervalMinutes, "minutes").toDate();

      // Count events that end after the current time
      const futureEventsCount = await EventModel.countDocuments({
        endTime: { $gt: now },
      });

      // If we have fewer future events than the configured number, we need to generate more
      return futureEventsCount < gameConfig.eventsPerGeneration;
    } catch (error) {
      console.error("Error checking need for new events:", error);
      throw error;
    }
  }

  /**
   * Update event details at schedule start time
   * @param eventId - Event ID
   * @param detailIndex - Index of the event detail to update
   * @returns Promise with updated event
   */
  async updateEventDetailAtScheduleStart(eventId: number, detailIndex: number): Promise<Event | null> {
    try {
      // Find the event
      const event = await EventModel.findOne({ eventID: eventId });
      if (!event) {
        console.error(`Event with ID ${eventId} not found`);
        return null;
      }

      // Get the event detail
      const eventDetail = event.eventDetails[detailIndex];
      if (!eventDetail) {
        console.error(`Event detail at index ${detailIndex} not found for event ${eventId}`);
        return null;
      }

      // Check if the detail already has playlist, goalInfo, and selections
      if (eventDetail.playlist && eventDetail.goalInfo && eventDetail.selections) {
        console.log(`Event detail at index ${detailIndex} for event ${eventId} already updated`);
        return event;
      }

      // Generate playlist URL (in a real app, this would be a real video URL)
      const playlist = `https://example.com/videos/event-${eventId}-half-${detailIndex + 1}.mp4`;

      // Generate goal info URL (in a real app, this would be a real JSON URL)
      const goalInfo = `https://example.com/data/event-${eventId}-half-${detailIndex + 1}.json`;

      // Generate selections
      const selections = generateSelections();

      // Update the event detail
      event.eventDetails[detailIndex].playlist = playlist;
      event.eventDetails[detailIndex].goalInfo = goalInfo;
      event.eventDetails[detailIndex].selections = selections;

      // Save the updated event
      await event.save();

      return event;
    } catch (error) {
      console.error(`Error updating event detail at schedule start for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Update event details at results available time
   * @param eventId - Event ID
   * @param detailIndex - Index of the event detail to update
   * @returns Promise with updated event
   */
  async updateEventDetailAtResultsAvailable(eventId: number, detailIndex: number): Promise<Event | null> {
    try {
      // Find the event
      const event = await EventModel.findOne({ eventID: eventId });
      if (!event) {
        console.error(`Event with ID ${eventId} not found`);
        return null;
      }

      // Get the event detail
      const eventDetail = event.eventDetails[detailIndex];
      if (!eventDetail) {
        console.error(`Event detail at index ${detailIndex} not found for event ${eventId}`);
        return null;
      }

      // Check if the detail already has a result
      if (eventDetail.result) {
        console.log(`Event detail at index ${detailIndex} for event ${eventId} already has result`);
        return event;
      }

      // Decrypt the result from the encrypted result
      const result = decryptData(eventDetail.encryptedResult);

      // Update the event detail with the result
      event.eventDetails[detailIndex].result = result;

      // Update the settlement status of selections based on the result
      if (eventDetail.selections) {
        eventDetail.selections.forEach((selection: Selection) => {
          if (selection.name === result.winner) {
            selection.settlementStatus = SettlementStatus.WIN;
          } else {
            selection.settlementStatus = SettlementStatus.LOSE;
          }
        });
      }

      // Save the updated event
      await event.save();

      return event;
    } catch (error) {
      console.error(`Error updating event detail at results available for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Check for missed updates and apply them
   * @returns Promise with array of updated events
   */
  async checkAndUpdateMissedEvents(): Promise<Event[]> {
    try {
      const now = new Date();
      const updatedEvents: Event[] = [];

      // Find all events that have not ended yet
      const events = await EventModel.find({
        endTime: { $gt: now },
      });

      for (const event of events) {
        let eventUpdated = false;

        // Check each event detail
        for (let i = 0; i < event.eventDetails.length; i++) {
          const detail = event.eventDetails[i];

          // Check if schedule start time has passed but detail is not updated
          if (detail.scheduleStartTs <= now && (!detail.playlist || !detail.goalInfo || !detail.selections)) {
            await this.updateEventDetailAtScheduleStart(event.eventID, i);
            eventUpdated = true;
          }

          // Check if results available time has passed but result is not updated
          if (detail.resultsAvailableTs <= now && !detail.result) {
            await this.updateEventDetailAtResultsAvailable(event.eventID, i);
            eventUpdated = true;
          }
        }

        if (eventUpdated) {
          // Get the updated event
          const updatedEvent = await EventModel.findOne({ eventID: event.eventID });
          if (updatedEvent) {
            updatedEvents.push(updatedEvent);
          }
        }
      }

      return updatedEvents;
    } catch (error) {
      console.error("Error checking and updating missed events:", error);
      throw error;
    }
  }

  /**
   * Get all events
   * @returns Promise with array of all events
   */
  async getAllEvents(): Promise<Event[]> {
    try {
      return await EventModel.find().sort({ eventID: 1 });
    } catch (error) {
      console.error("Error getting all events:", error);
      throw error;
    }
  }

  /**
   * Get event by ID
   * @param eventId - Event ID
   * @returns Promise with event or null if not found
   */
  async getEventById(eventId: number): Promise<Event | null> {
    try {
      return await EventModel.findOne({ eventID: eventId });
    } catch (error) {
      console.error(`Error getting event with ID ${eventId}:`, error);
      throw error;
    }
  }
}

export default new EventService();
