import { nanoid } from "nanoid";
import { getDocument, InputSource, TableName } from "./dynamodb";
import Model from "./Model";

export const model = "session" as const;
export type PKey = `session:${string}`;

export interface Session extends Model<typeof model, PKey, string> {
  nonce: string;
  userId?: string;
  discordAccessId?: string;
  ttl: number;
}

export function getPKey(sessionId: string): PKey {
  return `session:${sessionId}`;
}

export async function getSession(
  sessionId: string
): Promise<Session | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: {
      pkey: getPKey(sessionId),
    },
  });
  return result.Item as Session;
}

export function createSessionItem(input: InputSource<Session>): Session {
  const id = nanoid();
  const pkey = getPKey(id);
  const item: Session = {
    ...input,
    pkey,
    id,
    model,
    timestamp: Date.now(),
  };
  return item;
}
