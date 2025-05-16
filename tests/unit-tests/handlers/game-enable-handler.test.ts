import { Request, Response, NextFunction } from "express";
import { GameConfigService } from "../../../src/services/game-config-service";
import { enableGame } from "../../../src/handlers/game-enable-handler";
import mongoose from "mongoose";

describe("Game Enable Handler", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockGameConfigService: jest.Mocked<GameConfigService>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {
      body: {
        enabled: true,
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };
    mockNext = jest.fn();
    mockGameConfigService = {
      setGameEnabled: jest.fn(),
    } as any;
  });

  it("should enable game successfully", async () => {
    const expectedResult = {
      _id: new mongoose.Types.ObjectId(),
      gameId: 1,
      enabled: true,
    };
    mockGameConfigService.setGameEnabled.mockResolvedValue(expectedResult);

    const handler = enableGame(mockGameConfigService);
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockGameConfigService.setGameEnabled).toHaveBeenCalledWith(true);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseObject).toEqual(expectedResult);
  });

  it("should handle invalid request body", async () => {
    mockRequest.body = { enabled: "not-a-boolean" };

    const handler = enableGame(mockGameConfigService);
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(responseObject).toEqual({
      error: "Invalid request",
      message: "enabled must be a boolean value",
    });
  });

  it("should handle service errors", async () => {
    mockGameConfigService.setGameEnabled.mockRejectedValue(new Error("Service error"));

    const handler = enableGame(mockGameConfigService);
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseObject).toEqual({
      error: "Internal server error",
      message: "Failed to update game status",
    });
  });
});
