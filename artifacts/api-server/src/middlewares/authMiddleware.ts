export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.isAuthenticated = function (this: Request): this is Express.AuthedRequest {
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
