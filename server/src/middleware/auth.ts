import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthPayload {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      guestToken?: string;
    }
  }
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
      req.user = payload;
    } catch {
      // Invalid token — continue as guest
    }
  }

  const guestToken = req.headers["x-guest-token"] as string | undefined;
  if (guestToken) {
    req.guestToken = guestToken;
  }

  next();
}
