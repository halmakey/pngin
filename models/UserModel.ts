import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDocument, InputSource, TableName } from "./dynamodb";
import Model, { ByDiscordIndexName, ByModelIndexName } from "./Model";

export const model = "user" as const;
export type UserID = string;
export type PKey = `user:${UserID}`;
export type PKeyByDiscord = `user:${string}`;

export interface DiscordAccount {
  id: string;
  userName: string;
  discriminator: string;
  avatar: string | null;
  isGuildMember: boolean;
  guildMemberNick: string | null;
  guildMemberAvatar: string | null;
  guildMemberRoles: string[] | null;
}

export interface User extends Model<typeof model, PKey, UserID> {
  pkeyByDiscord?: string;
  name: string;
  avatarUrl: string;
  role: "user" | "admin";
  discord: DiscordAccount | null;
}

export function getPKey(userId: UserID): PKey {
  return `user:${userId}`;
}

export function getPKeyByDiscord(discordId: string): PKey {
  return `user:${discordId}`;
}

export function isUserID(userId: unknown): userId is UserID {
  return typeof userId === "string" && userId.startsWith("discord-");
}

export async function getUser(id: UserID): Promise<User | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: {
      pkey: getPKey(id),
    },
  });
  return result.Item as User;
}

export async function findUserByDiscord(
  discordId: string
): Promise<User | undefined> {
  const pkeyByDiscord = getPKeyByDiscord(discordId);
  const result = await getDocument().query({
    TableName,
    IndexName: ByDiscordIndexName,
    KeyConditionExpression: "#pkeyByDiscord = :dicordId",
    ExpressionAttributeNames: {
      "#pkeyByDiscord": "pkeyByDiscord",
    },
    ExpressionAttributeValues: {
      ":dicordId": pkeyByDiscord,
    },
  });
  return result.Items?.[0] as User;
}

export function createUserItem(
  input: InputSource<User, "pkeyByDiscord">
): User {
  const id = nanoid();
  const item: User = {
    ...input,
    pkey: getPKey(id),
    id,
    model,
    timestamp: Date.now(),
  };
  if (input.discord?.id) {
    item.pkeyByDiscord = getPKeyByDiscord(input.discord.id);
  }
  return item;
}

export async function listAllUsers() {
  let users: User[] = [];
  const pages = paginateQuery(
    { client: getDocument() },
    {
      TableName,
      IndexName: ByModelIndexName,
      KeyConditionExpression: "#model = :model",
      ExpressionAttributeNames: {
        "#model": "model",
      },
      ExpressionAttributeValues: {
        ":model": "user",
      },
    }
  );
  for await (const page of pages) {
    users = [...users, ...(page.Items as User[])];
  }
  return users;
}

export async function isEmpty() {
  const result = await getDocument().query({
    TableName,
    IndexName: ByModelIndexName,
    KeyConditionExpression: "#model = :model",
    ExpressionAttributeNames: {
      "#model": "model",
    },
    ExpressionAttributeValues: {
      ":model": "user",
    },
    Limit: 1,
  });
  return !result.Count;
}
