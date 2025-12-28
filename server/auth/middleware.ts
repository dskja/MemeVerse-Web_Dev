/**
 * EditVerse Authentication Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { getCurrentUser } from './local-auth';

// Middleware to check if user is authenticated
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Attach user to request for convenience
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

// Middleware to get current session (optional auth)
export async function getSession(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.session.userId) {
      const user = await getCurrentUser(req);
      if (user) {
        (req as any).user = user;
      }
    }
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next(); // Continue even if there's an error
  }
}
