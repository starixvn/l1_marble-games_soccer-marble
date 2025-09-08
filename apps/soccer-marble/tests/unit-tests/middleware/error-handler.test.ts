import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../../src/middleware/error-handler";

describe("Error Handler Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseObject: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should handle error with message", () => {
    const error = new Error("Test error message");
    error.stack = "test stack trace";

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(consoleSpy).toHaveBeenCalledWith("test stack trace");
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseObject).toEqual({
      error: "Internal server error",
      message: "Test error message",
    });
  });

  it("should handle error without message", () => {
    const error = new Error();
    error.stack = "test stack trace";

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(consoleSpy).toHaveBeenCalledWith("test stack trace");
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseObject).toEqual({
      error: "Internal server error",
      message: "Something went wrong",
    });
  });
});
