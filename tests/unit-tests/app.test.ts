import express from "express";
import http from "http";
import mongoose from "mongoose";
import { ContainerRegistry } from "../../src/container-registry";
import { StartUp } from "../../src/start-up";
import { setSecurityHeaders } from "../../src/middleware/security-header";
import { errorHandler } from "../../src/middleware/error-handler";

// Mock dependencies
jest.mock("express", () => {
  const mockExpress = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    set: jest.fn(),
  }));
  (mockExpress as any).json = jest.fn();
  return mockExpress;
});

jest.mock("http", () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, callback) => {
      callback();
      return { close: jest.fn() };
    }),
  })),
}));

jest.mock("sc-common", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("../../src/container-registry");
jest.mock("../../src/start-up");
jest.mock("../../src/middleware/verify-token");
jest.mock("../../src/middleware/security-header");
jest.mock("../../src/middleware/error-handler");
jest.mock("../../src/handlers/game-enable-handler");

describe("App", () => {
  let mockContainer: any;
  let mockAppConfigs: any;
  let mockGameConfigService: any;
  let mockStartUp: any;
  let mockExpressApp: any;
  let mockHttpServer: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock container
    mockAppConfigs = {
      hostingPort: 3000,
      adminToken: "test-admin-token",
    };
    mockGameConfigService = {
      setGameEnabled: jest.fn(),
    };
    mockContainer = {
      resolve: jest.fn((key) => {
        switch (key) {
          case "appConfigs":
            return mockAppConfigs;
          case "gameConfigService":
            return mockGameConfigService;
          default:
            return null;
        }
      }),
    };

    // Setup mock Express app
    mockExpressApp = {
      use: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      set: jest.fn(),
    };
    (express as unknown as jest.Mock).mockReturnValue(mockExpressApp);

    // Setup mock HTTP server
    mockHttpServer = {
      listen: jest.fn((port, callback) => {
        callback();
        return { close: jest.fn() };
      }),
    };
    (http.createServer as jest.Mock).mockReturnValue(mockHttpServer);

    // Setup mock StartUp
    mockStartUp = {
      configureDatabaseAndSentry: jest.fn().mockResolvedValue(undefined),
      start: jest.fn(),
    };
    (StartUp as jest.Mock).mockImplementation(() => mockStartUp);

    // Setup ContainerRegistry mock
    (ContainerRegistry as jest.Mock).mockImplementation(() => ({
      register: jest.fn().mockReturnValue(mockContainer),
    }));
  });

  it("should configure Express app with middleware", async () => {
    // Import app to trigger the run function
    await import("../../src/app");

    expect(mockExpressApp.use).toHaveBeenCalledWith((express as any).json());
    expect(mockExpressApp.use).toHaveBeenCalledWith(setSecurityHeaders);
    expect(mockExpressApp.use).toHaveBeenCalledWith(errorHandler);
  });

  it("should set up health check route", async () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock mongoose connection state
    Object.defineProperty(mongoose.connection, "readyState", {
      get: jest.fn().mockReturnValue(1),
    });

    await import("../../src/app");

    // Get the route handler
    const routeHandler = mockExpressApp.get.mock.calls[0][1];
    await routeHandler({}, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
        message: "Soccer marble service running",
        database: "connected",
      })
    );
  });

  it("should set up game enable route with middleware", async () => {
    await import("../../src/app");

    expect(mockExpressApp.post).toHaveBeenCalledWith(
      "/game/enable",
      expect.any(Function), // verifyAdminToken middleware
      expect.any(Function) // enableGame handler
    );
  });

  it("should configure server with correct port", async () => {
    await import("../../src/app");

    expect(mockExpressApp.set).toHaveBeenCalledWith("port", mockAppConfigs.hostingPort);
    expect(mockHttpServer.listen).toHaveBeenCalledWith(mockAppConfigs.hostingPort, expect.any(Function));
  });

  it("should start the application", async () => {
    await import("../../src/app");

    expect(mockStartUp.configureDatabaseAndSentry).toHaveBeenCalled();
    expect(mockStartUp.start).toHaveBeenCalled();
  });

  it("should handle startup errors", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const processSpy = jest.spyOn(process, "exit").mockImplementation();

    // Mock an error in the startup process
    mockStartUp.configureDatabaseAndSentry.mockRejectedValue(new Error("Startup error"));

    await import("../../src/app");

    expect(consoleSpy).toHaveBeenCalledWith("App running error:", expect.any(Error));
    expect(processSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    processSpy.mockRestore();
  });
});
