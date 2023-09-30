import { IncomingMessage } from "http";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { NextApiRequestCookies } from "next/dist/server/api-utils";
import { verifySessionToken } from "../token";
import { SessionModel, UserModel } from "@/models";

export function withUser<R = { [key: string]: never }>(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse<R | { [key: string]: never }>,
    user: UserModel.User
  ) => Promise<unknown>
): NextApiHandler<R | { [key: string]: never }> {
  return async (req, res) => {
    const { session, user } = await verifySessionUser(req);
    if (!session || !user) {
      return res.status(401).json({});
    }
    return handler(req, res, user);
  };
}

export function withAdmin<R = { [key: string]: never }>(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse<R | { [key: string]: never }>,
    user: UserModel.User
  ) => Promise<unknown>
): NextApiHandler<R | { [key: string]: never }> {
  return async (req, res) => {
    const { session, user } = await verifySessionUser(req);
    if (!session || !user) {
      return res.status(401).json({});
    }
    if (user.role !== "admin") {
      return res.status(403).json({});
    }
    return handler(req, res, user);
  };
}

export async function verifySessionUser(
  req: IncomingMessage & {
    cookies: NextApiRequestCookies;
  }
): Promise<{ session?: SessionModel.Session; user?: UserModel.User }> {
  const { token } = req.cookies;
  const payload = token && (await verifySessionToken(token));

  if (!payload) {
    return {};
  }

  const [session, user] = await Promise.all([
    SessionModel.getSession(payload.session.id),
    payload.session.userId
      ? UserModel.getUser(payload.session.userId as UserModel.UserID)
      : Promise.resolve(undefined),
  ]);
  return {
    session,
    user,
  };
}
