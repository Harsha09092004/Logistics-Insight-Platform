import * as oidc from "openid-client";
import { Request, Response, NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";

import {
  clearSession,
  getOidcConfig,
  getSessionId,
  getSession,
  updateSession,
  type SessionData,
} from "../lib/auth";

/**
 * Extend Express types
 */
declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface AuthedRequest extends Request {
      user: User;
    }

    interface Request {
      user?: User;
      isAuthenticated(): this is AuthedRequest;
    }
  }
}

/**
 * Refresh token if expired
 */
async function refreshIfExpired(
  sid: string,
  session: SessionData
): Promise<SessionData | null> {
  const now = Math.floor(Date.now() / 1000);

  if (!session.expires_at || now <= session.expires_at) {
    return session;
  }

  if (!session.refresh_token) {
    return null;
  }

  try {
    const config = await getOidcConfig();

    const tokens = await oidc.refreshTokenGrant(
      config,
      session.refresh_token
    );

    session.access_token = tokens.access_token;

    session.refresh_token =
      tokens.refresh_token ?? session.refresh_token;

    if (tokens.expiresIn()) {
      session.expires_at = now + tokens.expiresIn()!;
    }

    await updateSession(sid, session);

    return session;
  } catch {
    return null;
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.isAuthenticated = function (
    this: Request
  ): this is Express.AuthedRequest {
    return this.user != null;
  };

  const sid = getSessionId(req);

  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);

  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  const refreshed = await refreshIfExpired(sid, session);

  if (!refreshed) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = refreshed.user;

  next();
}
