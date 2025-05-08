import { Request, Response, NextFunction, RequestHandler } from "express";

export const verifyAdminToken = (adminToken: string): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (token !== adminToken) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    next();
  };
};
