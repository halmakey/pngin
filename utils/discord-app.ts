import { APIUser, CDN } from "discord.js";

const cdn = new CDN();

async function normalize<T = unknown>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const json = await response.json();
      throw new Error(json.error + ": " + json.error_description);
    } catch {
      throw new Error(
        response.statusText +
          ":" +
          (await response.text().catch(() => "no body"))
      );
    }
  }
  return await response.json();
}

export function createDiscordApp({
  clientId,
  secret,
}: {
  clientId: string;
  secret: string;
}) {
  return {
    getSignInUrl(state: string, redirectUri: string): string {
      return `https://discord.com/oauth2/authorize?response_type=code&client_id=${clientId}&scope=identify&state=${state}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&prompt=consent`;
    },
    async authorizeCodeGrant(
      code: string,
      redirectUri: string
    ): Promise<{
      access_token: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
      token_type: string;
    }> {
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: secret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      });

      const result = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      return await normalize(result);
    },
    async getMe(accessToken: string): Promise<APIUser> {
      const result = await fetch("https://discord.com/api/users/@me", {
        headers: {
          authorization: "Bearer " + accessToken,
        },
      });
      return normalize<APIUser>(result);
    },
    async revokeTokens({
      refreshToken,
      accessToken,
    }: {
      refreshToken: string;
      accessToken: string;
    }) {
      await Promise.all([
        fetch("https://discord.com/api/oauth2/token/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: refreshToken,
            token_type_hint: "refresh_token",
          }),
        }),
        fetch("https://discord.com/api/oauth2/token/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: accessToken,
            token_type_hint: "access_token",
          }),
        }),
      ]);
    },
  };
}

export async function getBotGuildRoles(botToken: string, guildId: string) {
  const res = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
    headers: {
      Authorization: "Bot " + botToken,
    },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return (await res.json()) as {
    id: string;
    name: string;
    description: null;
    permissions: number;
    position: number;
    color: number;
    hoist: boolean;
    managed: boolean;
    mentionable: boolean;
    icon: null | string;
    permissions_new: string;
  }[];
}

export interface Member {
  avatar?: null | string;
  nick?: null | string;
  pending?: null | boolean;
  joined_at: string;
  roles: string[];
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
  };
}

export async function getBotGuildMembers(botToken: string, guildId: string) {
  let after = "";
  let result: Member[] = [];
  let hasNext: boolean;
  do {
    const res = await fetch(
      `https://discord.com/api/guilds/${guildId}/members?limit=1000${
        after ? `&after=${after}` : ""
      }`,
      {
        headers: {
          Authorization: "Bot " + botToken,
        },
      }
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const page: Member[] = await res.json();
    result = [...result, ...page];

    hasNext = page.length === 1000;
    after = page[999]?.user?.id || "";
  } while (hasNext);

  return result;
}

export async function getBotGuildMember(
  botToken: string,
  guildId: string,
  userId: string
) {
  const res = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${userId}`,
    {
      headers: {
        Authorization: "Bot " + botToken,
      },
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()) as Member;
}

export function getAvatarUrl(userId: string, avatar: string) {
  return cdn.avatar(userId, avatar);
}

export function getMemberAvatarUrl(
  guildId: string,
  userId: string,
  avatar: string
) {
  return cdn.guildMemberAvatar(guildId, userId, avatar);
}
