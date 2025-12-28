/**
 * EditVerse Local Authentication System
 * Using bcrypt for password hashing and express-session for session management
 */

import bcrypt from 'bcrypt';
import session from 'express-session';
import FileStore from 'session-file-store';
import type { Express, Request, Response, NextFunction } from 'express';
import { jsonStorage } from '../storage/json-storage';
import { join } from 'path';

const SessionFileStore = FileStore(session);

// Extend Express session to include userId
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || 'editverse-dev-secret-change-in-production';
const SALT_ROUNDS = 10;

export function setupAuth(app: Express) {
  // Configure session middleware
  app.use(
    session({
      store: new SessionFileStore({
        path: join(process.cwd(), 'sessions'),
        ttl: 86400 * 7, // 7 days
        retries: 3,
      }),
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      },
    })
  );
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Register new user
export async function registerUser(
  email: string,
  username: string,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if email already exists
    const existingEmail = await jsonStorage.getUserByEmail(email);
    if (existingEmail) {
      return { success: false, error: 'Email already registered' };
    }

    // Check if username already exists
    const existingUsername = await jsonStorage.getUserByUsername(username);
    if (existingUsername) {
      return { success: false, error: 'Username already taken' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await jsonStorage.createUser({
      email,
      username,
      passwordHash,
    });

    // Create default profile
    await jsonStorage.upsertProfile({
      userId: user.id,
      displayName: username,
      xp: 0,
      level: 'rookie',
      isVerified: false,
      profileFrame: 'none',
      isCreatorOfMonth: false,
      theme: 'dark-cinematic',
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

// Login user
export async function loginUser(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Try to find user by email or username
    let user = await jsonStorage.getUserByEmail(emailOrUsername);
    if (!user) {
      user = await jsonStorage.getUserByUsername(emailOrUsername);
    }

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

// Get current user from session
export async function getCurrentUser(req: Request) {
  if (!req.session.userId) {
    return null;
  }

  try {
    const user = await jsonStorage.getUserById(req.session.userId);
    if (!user) {
      return null;
    }

    // Don't return password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Logout user
export function logoutUser(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
