import rateLimit from "express-rate-limit";

/**
 * Strict rate limiting for authentication endpoints
 * 5 requests per minute per IP
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many authentication attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Moderate rate limiting for state-changing operations
 * 20 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET", // Skip GET requests
});

/**
 * Relaxed rate limiting for read operations
 * 100 requests per minute per IP
 */
export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: "Too many requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Upload rate limiting
 * 10 uploads per 5 minutes per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: "Too many uploads. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
