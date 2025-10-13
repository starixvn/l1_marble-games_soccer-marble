import { Request, Response, NextFunction } from "express";
import { setSecurityHeaders } from "../../../src/middleware/security-header";

describe("Security Headers Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should set all required security headers", () => {
    setSecurityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
    expect(mockResponse.setHeader).toHaveBeenCalledWith("X-XSS-Protection", "1; mode=block");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should call next() after setting headers", () => {
    setSecurityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
