import { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../../../src/middleware/verify-token";

describe("Token Verification Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseObject: any;
  const testAdminToken = "test-admin-token";

  beforeEach(() => {
    responseObject = {};
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };
    mockNext = jest.fn();
  });

  it("should allow request with valid token", async () => {
    mockRequest.headers = {
      authorization: `Bearer ${testAdminToken}`,
    };

    const middleware = verifyAdminToken(testAdminToken);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it("should reject request with missing authorization header", async () => {
    const middleware = verifyAdminToken(testAdminToken);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(responseObject).toEqual({
      message: "Missing or invalid authorization header",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with invalid token format", async () => {
    mockRequest.headers = {
      authorization: "InvalidFormat",
    };

    const middleware = verifyAdminToken(testAdminToken);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(responseObject).toEqual({
      message: "Missing or invalid authorization header",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with incorrect token", async () => {
    mockRequest.headers = {
      authorization: "Bearer wrong-token",
    };

    const middleware = verifyAdminToken(testAdminToken);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(responseObject).toEqual({
      message: "Invalid token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when authorization header is missing", async () => {
    const middleware = verifyAdminToken("test-token");
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Missing or invalid authorization header" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when authorization header does not start with Bearer", async () => {
    mockRequest.headers = {
      authorization: "Invalid test-token",
    };

    const middleware = verifyAdminToken("test-token");
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Missing or invalid authorization header" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid", async () => {
    mockRequest.headers = {
      authorization: "Bearer wrong-token",
    };

    const middleware = verifyAdminToken("test-token");
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next() when token is valid", async () => {
    mockRequest.headers = {
      authorization: "Bearer test-token",
    };

    const middleware = verifyAdminToken("test-token");
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });
});
