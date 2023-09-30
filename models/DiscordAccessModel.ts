import { nanoid } from "nanoid";
import { getDocument, InputSource, TableName } from "./dynamodb";
import Model from "./Model";

export const model = "discord-access" as const;
export type PKey = `discord-access:${string}`;

export interface DiscordAccess extends Model<typeof model, PKey, string> {
  discordId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  scope: string;
  ttl: number;
}

function getPKey(accessId: string): PKey {
  return `discord-access:${accessId}`;
}

export async function getDiscordAccess(accessId: string) {
  const result = await getDocument().get({
    TableName,
    Key: { pkey: getPKey(accessId) },
  });
  return result.Item as DiscordAccess | undefined;
}

export function createDiscordAccessItem(
  input: InputSource<DiscordAccess, "ttl">
) {
  const id = nanoid();
  const pkey = getPKey(id);
  const timestamp = Date.now();
  const item: DiscordAccess = {
    ...input,
    id,
    pkey,
    model,
    timestamp,
    ttl: Math.floor(timestamp / 1000) + input.expiresIn,
  };
  return item;
}
