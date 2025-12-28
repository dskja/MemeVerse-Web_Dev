/**
 * EditVerse Authentication Routes
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, getCurrentUser, logoutUser } from './local-auth';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export function registerAuthRoutes(app: Express) {
  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const result = await registerUser(data.email, data.username, data.password);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Auto-login after registration
      req.session.userId = result.userId!;
      
      res.json({ success: true, userId: result.userId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const result = await loginUser(data.emailOrUsername, data.password);
      
      if (!result.success) {
        return res.status(401).json({ error: result.error });
      }

      // Set session
      req.session.userId = result.userId!;
      
      res.json({ success: true, userId: result.userId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      await logoutUser(req);
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });
}
