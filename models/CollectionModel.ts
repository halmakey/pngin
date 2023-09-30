import { nanoid } from "nanoid";
import { InputSource, TableName, getDocument } from "./dynamodb";
import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import Model, { ByModelSequenceIndexName } from "./Model";

export const model = "collection" as const;
export type PKey = `collection:${string}`;

export interface Collection extends Model<typeof model, PKey, string> {
  name: string;
  sequence: number;
  url: string;
  formActive: boolean;
  visible: boolean;
  submissionsPerAuthor: number;
}

function getPKey(collectionId: string): PKey {
  return `collection:${collectionId}`;
}

export async function listAllCollection(): Promise<Collection[]> {
  let collections: Collection[] = [];
  const pages = paginateQuery(
    {
      client: getDocument(),
    },
    {
      TableName,
      IndexName: ByModelSequenceIndexName,
      KeyConditions: {
        model: {
          AttributeValueList: [model],
          ComparisonOperator: "EQ",
        },
      },
      ScanIndexForward: true,
    }
  );
  for await (const page of pages) {
    collections = [...collections, ...(page.Items as Collection[])];
  }
  return collections;
}

export async function getCollection(
  id: string
): Promise<Collection | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: { pkey: getPKey(id) },
  });
  return result.Item as Collection;
}

export async function getCollections(...ids: string[]): Promise<Collection[]> {
  if (ids.length > 100) {
    throw new Error("ids.length exceeds 100");
  }
  if (!ids.length) {
    return [];
  }
  const pkeys = ids.map((id) => ({ pkey: getPKey(id) }));

  const result = await getDocument().batchGet({
    RequestItems: {
      [TableName]: { Keys: pkeys },
    },
  });
  if (!result.Responses?.[TableName]) {
    return [];
  }
  const items = result.Responses![TableName] as Collection[];

  return items;
}

export function createCollectionItem(input: InputSource<Collection>) {
  const id = nanoid(7);
  const item: Collection = {
    ...input,
    pkey: getPKey(id),
    id,
    model,
    timestamp: Date.now(),
  };
  return item;
}
