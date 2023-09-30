import Model, { ByCollectionIndexName } from "./Model";
import { InputSource, TableName, getDocument } from "./dynamodb";
import { paginateQuery } from "@aws-sdk/lib-dynamodb";

export const model = "export-result" as const;
export type PKey = `export-result:${string}`;

export interface ExportResult extends Model<typeof model, PKey, string> {
  pkeyByCollection: string;
  collectionId: string;
  paths: string[];
  status: "process" | "complete" | "error";
  message?: string;
  startTime: number;
  endTime?: number;
}

function getPKey(exportId: string): PKey {
  return `export-result:${exportId}`;
}

function getPKeyByCollection(collectionId: string): PKey {
  return `export-result:${collectionId}`;
}

export async function getExportResult(
  id: string
): Promise<ExportResult | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: { pkey: getPKey(id) },
  });
  return result.Item as ExportResult;
}

export function createExportResult(
  exportId: string,
  input: InputSource<ExportResult>
) {
  const pkey = getPKey(exportId);
  const pkeyByCollection = getPKeyByCollection(input.collectionId);
  const item: ExportResult = {
    ...input,
    pkey,
    pkeyByCollection,
    id: exportId,
    model,
    timestamp: Date.now(),
  };
  return item;
}

export async function findExportResultsByCollection(collectionId: string) {
  const pkeyByCollection = getPKeyByCollection(collectionId);
  let results: ExportResult[] = [];
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
    }
  );
  for await (const page of pages) {
    results = [...results, ...(page.Items as ExportResult[])];
  }
  return results;
}
