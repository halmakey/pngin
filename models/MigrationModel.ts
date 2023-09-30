import Model from "./Model";
import { createTransactWrite, getDocument, TableName } from "./dynamodb";

export const model = "migration" as const;
export type PKey = `migration:${string}`;

export interface Migration extends Model<typeof model, PKey, string> {}

function getPKey(id: string): PKey {
  return `migration:${id}`;
}

export async function getMigration(id: string): Promise<Migration | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: {
      pkey: getPKey(id),
    },
  });
  return result.Item as Migration;
}

export function createMigration(id: string): Migration {
  const pkey = getPKey(id);
  return {
    pkey,
    model,
    id,
    timestamp: Date.now(),
  };
}

export async function migrate(id: string, up: () => Promise<void>) {
  let migration = await getMigration(id);
  if (migration) {
    return;
  }
  await up();
  migration = createMigration(id);
  await createTransactWrite().put(migration).write();
}
