import { Request, Response } from "express";
import EventService from "../services/EventService";

class EventController {
  /**
   * Get all events
   * @param req - Express request
   * @param res - Express response
   */
  async getAllEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await EventService.getAllEvents();
      res.status(200).json({
        success: true,
        count: events.length,
        data: events,
      });
    } catch (error) {
      console.error("Error getting all events:", error);
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }

  /**
   * Get event by ID
   * @param req - Express request
   * @param res - Express response
   */
  async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const eventId = parseInt(req.params.id, 10);

      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: "Invalid event ID",
        });
        return;
      }

      const event = await EventService.getEventById(eventId);

      if (!event) {
        res.status(404).json({
          success: false,
          error: "Event not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      console.error("Error getting event by ID:", error);
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }

  /**
   * Manually trigger event generation
   * @param req - Express request
   * @param res - Express response
   */
  async generateEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await EventService.generateEvents();
      res.status(201).json({
        success: true,
        count: events.length,
        data: events,
      });
    } catch (error) {
      console.error("Error generating events:", error);
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }

  /**
   * Manually check and update missed events
   * @param req - Express request
   * @param res - Express response
   */
  async checkAndUpdateMissedEvents(req: Request, res: Response): Promise<void> {
    try {
      const updatedEvents = await EventService.checkAndUpdateMissedEvents();
      res.status(200).json({
        success: true,
        count: updatedEvents.length,
        data: updatedEvents,
      });
    } catch (error) {
      console.error("Error checking and updating missed events:", error);
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }
}

export default new EventController();
