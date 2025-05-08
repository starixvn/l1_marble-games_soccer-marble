import { Request, Response, RequestHandler } from "express";
import { GameConfigService } from "../services/game-config-service";

export const enableGame = (gameConfigService: GameConfigService): RequestHandler => {
  return async (req: Request, res: Response): Promise<void> => {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      res.status(400).json({
        error: "Invalid request",
        message: "enabled must be a boolean value",
      });
    }

    try {
      const result = await gameConfigService.setGameEnabled(enabled);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating game status:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to update game status",
      });
    }
  };
};
