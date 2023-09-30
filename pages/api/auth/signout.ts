import { DiscordAccessModel, SessionModel } from "@/models";
import { createTransactWrite } from "@/models/dynamodb";
import { discordApp } from "@/utils/api-server/shared";
import { verifySessionToken } from "@/utils/token";
import cookie from "cookie";
import { NextApiRequest, NextApiResponse } from "next";

async function signout(req: NextApiRequest, res: NextApiResponse) {
  const path =
    (req.headers.referer && new URL(req.headers.referer).pathname) || "/";
  res
    .setHeader(
      "Set-Cookie",
      cookie.serialize("token", "", {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        path: "/",
      })
    )
    .redirect(path);

  const token = req.cookies.token;
  if (!token) {
    return;
  }
  const payload = await verifySessionToken(token);
  if (!payload) {
    return;
  }
  const session = await SessionModel.getSession(payload.session.id);
  if (!session) {
    return;
  }

  const tx = createTransactWrite();
  tx.delete(session.pkey);

  const access =
    session.discordAccessId &&
    (await DiscordAccessModel.getDiscordAccess(session.discordAccessId));
  if (access) {
    await discordApp.revokeTokens({
      refreshToken: access.refreshToken,
      accessToken: access.accessToken,
    });
    tx.delete(access.pkey);
  }

  await tx.write().catch((err) => {
    console.warn(err);
    /* NOP */
  });
}

export default signout;
