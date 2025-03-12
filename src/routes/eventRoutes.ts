import { Router } from "express";
import EventController from "../controllers/EventController";

const router = Router();

// Get all events
router.get("/", EventController.getAllEvents);

// Get event by ID
router.get("/:id", EventController.getEventById);

// Manually trigger event generation
router.post("/generate", EventController.generateEvents);

// Manually check and update missed events
router.post("/check-missed", EventController.checkAndUpdateMissedEvents);

export default router;
