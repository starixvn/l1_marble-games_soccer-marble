import { Request, Response, RequestHandler, NextFunction } from "express";
import { GameConfigService } from "../services/game-config-service";

export const enableGame = (gameConfigService: GameConfigService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      res.status(400).json({
        error: "Invalid request",
        message: "enabled must be a boolean value",
      });
      return;
    }

    try {
      const result = await gameConfigService.setGameEnabled(enabled);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to update game status",
      });
    }
  };
};
