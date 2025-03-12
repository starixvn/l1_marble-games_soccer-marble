import cron from "node-cron";
import EventService from "./EventService";
import { gameConfig } from "../config";
import { Event } from "../types";

class SchedulerService {
  private eventGenerationJob: cron.ScheduledTask | null = null;
  private eventUpdateJob: cron.ScheduledTask | null = null;

  /**
   * Start the scheduler service
   */
  start(): void {
    console.log("Starting scheduler service...");

    // Check for missed events on startup
    this.checkMissedEvents();

    // Schedule event generation job
    // Run every X minutes as specified in the config
    this.eventGenerationJob = cron.schedule(`*/${gameConfig.generationIntervalMinutes} * * * *`, async () => {
      console.log("Running event generation job...");
      try {
        // Check if we need to generate new events
        const needNewEvents = await EventService.checkNeedForNewEvents();

        if (needNewEvents) {
          console.log("Generating new events...");
          await EventService.generateEvents();
        } else {
          console.log("No need to generate new events");
        }
      } catch (error) {
        console.error("Error in event generation job:", error);
      }
    });

    // Schedule event update job
    // Run every minute to check for events that need updates
    this.eventUpdateJob = cron.schedule("* * * * *", async () => {
      console.log("Running event update job...");
      try {
        await EventService.checkAndUpdateMissedEvents();
      } catch (error) {
        console.error("Error in event update job:", error);
      }
    });

    console.log("Scheduler service started");
  }

  /**
   * Stop the scheduler service
   */
  stop(): void {
    console.log("Stopping scheduler service...");

    if (this.eventGenerationJob) {
      this.eventGenerationJob.stop();
      this.eventGenerationJob = null;
    }

    if (this.eventUpdateJob) {
      this.eventUpdateJob.stop();
      this.eventUpdateJob = null;
    }

    console.log("Scheduler service stopped");
  }

  /**
   * Check for missed events on startup
   */
  private async checkMissedEvents(): Promise<void> {
    console.log("Checking for missed events...");

    try {
      // Check if we need to generate new events
      const needNewEvents = await EventService.checkNeedForNewEvents();

      if (needNewEvents) {
        console.log("Generating missed events...");
        await EventService.generateEvents();
      }

      // Check for missed updates
      console.log("Checking for missed updates...");
      const updatedEvents = await EventService.checkAndUpdateMissedEvents();

      console.log(`Updated ${updatedEvents.length} missed events`);
    } catch (error) {
      console.error("Error checking missed events:", error);
    }
  }
}

export default new SchedulerService();
