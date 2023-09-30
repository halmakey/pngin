import { nanoid } from "nanoid";
import { InputSource, TableName, getDocument } from "./dynamodb";
import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import Model, { ByCollectionIndexName } from "./Model";

export const model = "export-request" as const;
export type PKey = `export-request:${string}`;

export interface ExportRequest extends Model<typeof model, PKey, string> {
  pkeyByCollection: string;
  collectionId: string;
}

function getPKey(exportId: string): PKey {
  return `export-request:${exportId}`;
}

function getPKeyByCollection(collectionId: string): PKey {
  return `export-request:${collectionId}`;
}

export async function getExportRequest(
  id: string
): Promise<ExportRequest | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: { pkey: getPKey(id) },
  });
  return result.Item as ExportRequest;
}

export function createExportRequest(input: InputSource<ExportRequest>) {
  const id = nanoid(8);
  const pkey = getPKey(id);
  const pkeyByCollection = getPKeyByCollection(input.collectionId);
  const item: ExportRequest = {
    ...input,
    pkey,
    pkeyByCollection,
    id,
    model,
    timestamp: Date.now(),
  };
  return item;
}

export async function findExportRequestsByCollection(collectionId: string) {
  const pkeyByCollection = getPKeyByCollection(collectionId);
  let requests: ExportRequest[] = [];
  const pages = paginateQuery(
    {
      client: getDocument(),
    },
    {
      TableName,
      IndexName: ByCollectionIndexName,
      KeyConditions: {
        pkeyByCollection: {
          AttributeValueList: [pkeyByCollection],
          ComparisonOperator: "EQ",
        },
      },
      ScanIndexForward: false,
    }
  );
  for await (const page of pages) {
    requests = [...requests, ...(page.Items as ExportRequest[])];
  }
  return requests;
}

export async function findLatestExportByCollection(
  collectionId: string
): Promise<ExportRequest | undefined> {
  const pkeyByCollection = getPKeyByCollection(collectionId);

  const result = await getDocument().query({
    TableName,
    IndexName: ByCollectionIndexName,
    KeyConditions: {
      pkeyByCollection: {
        AttributeValueList: [pkeyByCollection],
        ComparisonOperator: "EQ",
      },
    },
    ScanIndexForward: false,
    Limit: 1,
  });

  return result.Items?.[0] as ExportRequest;
}
