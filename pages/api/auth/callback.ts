import { DiscordAccessModel, SessionModel, UserModel } from "@/models";
import { createTransactWrite } from "@/models/dynamodb";
import { discordApp, getAuthRedirectUrl } from "@/utils/api-server/shared";
import {
  getAvatarUrl,
  getBotGuildMember,
  getMemberAvatarUrl,
} from "@/utils/discord-app";
import { createSessionToken, verifySessionToken } from "@/utils/token";
import cookie from "cookie";
import { NextApiRequest, NextApiResponse } from "next";

const IS_DEV = process.env.NODE_ENV === "development";

// Optional Discord Bot
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

async function callback(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  // check parameters
  if (
    !code ||
    typeof code !== "string" ||
    !state ||
    typeof state !== "string"
  ) {
    return res.redirect("/");
  }

  // grant access
  try {
    const redirectUrl = getAuthRedirectUrl(req.headers.host!);
    const token = await discordApp.authorizeCodeGrant(code, redirectUrl);

    const me = await discordApp.getMe(token.access_token);
    const member =
      (BOT_TOKEN &&
        GUILD_ID &&
        (await getBotGuildMember(BOT_TOKEN, GUILD_ID, me.id).catch((err) =>
          console.warn(err)
        ))) ||
      undefined;
    const isFirstUser = await UserModel.isEmpty();

    const payload = await verifySessionToken(state);
    if (!payload) {
      throw new Error("invalid state: " + state);
    }

    let session = await SessionModel.getSession(payload.session.id);
    if (!session) {
      throw new Error("Session not found: " + state);
    }

    const now = new Date();

    if (session.ttl < now.valueOf() / 1000) {
      throw new Error("Session expired");
    }
    if (session?.nonce !== payload.session.nonce) {
      throw new Error("Session nonce unmatched");
    }
    if (!!session.userId) {
      throw new Error("Session already logged-in as " + session.userId);
    }

    const tx = createTransactWrite();

    const access = DiscordAccessModel.createDiscordAccessItem({
      discordId: me.id,
      accessToken: token.access_token,
      tokenType: token.token_type,
      expiresIn: token.expires_in,
      refreshToken: token.refresh_token,
      scope: token.scope,
    });
    tx.put(access, "noexists");

    const memberAvatar =
      GUILD_ID &&
      member?.avatar &&
      getMemberAvatarUrl(GUILD_ID, me.id, member.avatar);
    const accountAvatar = me.avatar && getAvatarUrl(me.id, me.avatar);

    const discord: UserModel.DiscordAccount = {
      id: me.id,
      userName: me.username,
      avatar: me.avatar,
      discriminator: me.discriminator,
      isGuildMember: !!member,
      guildMemberNick: member?.nick ?? null,
      guildMemberAvatar: member?.avatar ?? null,
      guildMemberRoles: member?.roles ?? null,
    };

    let user = await UserModel.findUserByDiscord(discord.id);
    if (user) {
      user.name = member?.nick || me.username;
      user.avatarUrl = memberAvatar || accountAvatar || "/anonymous.svg";
      user.timestamp = Date.now();
      user.discord = discord;

      tx.put(user, "exists");
    } else {
      user = UserModel.createUserItem({
        name: member?.nick || me.username,
        avatarUrl: memberAvatar || accountAvatar || "/anonymous.svg",
        role: isFirstUser ? "admin" : "user",
        discord,
      });
      tx.put(user, "noexists");
    }

    session.userId = user.id;
    session.discordAccessId = access.id;
    session.timestamp = Date.now();
    session.ttl = Math.floor(session.timestamp / 1000) + token.expires_in;

    tx.put(session, "exists");

    await tx.write();

    const sessionToken = await createSessionToken(session, token.expires_in);

    return res
      .setHeader(
        "Set-Cookie",
        cookie.serialize("token", sessionToken, {
          maxAge: token.expires_in,
          httpOnly: true,
          secure: !IS_DEV,
          path: "/",
        })
      )
      .redirect(payload.callback || "/");
  } catch (err) {
    console.error(err);
    return res.redirect("/");
  }
}

export default callback;
