import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { PORT, MONGODB_URI } from "./config";
import eventRoutes from "./routes/eventRoutes";
import SchedulerService from "./services/SchedulerService";

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/events", eventRoutes);

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Start the scheduler service
      SchedulerService.start();

      // Handle graceful shutdown
      process.on("SIGINT", () => {
        console.log("SIGINT received. Shutting down gracefully...");
        SchedulerService.stop();
        mongoose.connection.close();
        process.exit(0);
      });

      process.on("SIGTERM", () => {
        console.log("SIGTERM received. Shutting down gracefully...");
        SchedulerService.stop();
        mongoose.connection.close();
        process.exit(0);
      });
    });
  })
  .catch((err: Error) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
