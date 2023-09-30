import Model, { ByCollectionSequenceIndexName } from "./Model";
import { SubmissionID } from "./SubmissionModel";
import { InputSource, TableName, getDocument } from "./dynamodb";
import { paginateQuery } from "@aws-sdk/lib-dynamodb";

export const model = "collection-path" as const;
export type CollectionPathID = `${string}.${string}`;
export type PKey = `collection-path:${CollectionPathID}`;
export type PKeyByCollection = `collection-path:${string}`;

export interface CollectionPath
  extends Model<typeof model, PKey, CollectionPathID> {
  pkeyByCollection: PKeyByCollection;
  collectionId: string;
  path: string;
  submissionIds: SubmissionID[];
  sequence: number;
}

function getPKey(collectionId: string, path: string): PKey {
  return `collection-path:${collectionId}.${path}`;
}

function getPKeyByCollection(collectionId: string): PKeyByCollection {
  return `collection-path:${collectionId}`;
}

export function getCollectionPathId(
  collectionId: string,
  path: string
): CollectionPathID {
  return `${collectionId}.${path}`;
}

export async function getCollectionPath(collectionId: string, path: string) {
  const result = await getDocument().get({
    TableName,
    Key: {
      pkey: getPKey(collectionId, path),
    },
  });
  return result.Item as CollectionPath | undefined;
}

export async function findCollectionPathsByCollection(
  collectionId: string
): Promise<CollectionPath[]> {
  const pkeyByCollection = getPKeyByCollection(collectionId);
  const pages = paginateQuery(
    {
      client: getDocument(),
    },
    {
      TableName,
      IndexName: ByCollectionSequenceIndexName,
      KeyConditions: {
        pkeyByCollection: {
          AttributeValueList: [pkeyByCollection],
          ComparisonOperator: "EQ",
        },
      },
      ScanIndexForward: true,
    }
  );

  let colletionPaths: CollectionPath[] = [];
  for await (const page of pages) {
    colletionPaths = [...colletionPaths, ...(page.Items as CollectionPath[])];
  }

  return colletionPaths;
}

export function createCollectionPathItem(
  collectionId: string,
  path: string,
  input: InputSource<CollectionPath, "collectionId" | "path">
) {
  const id = getCollectionPathId(collectionId, path);
  const pkey = getPKey(collectionId, path);
  const pkeyByCollection = getPKeyByCollection(collectionId);
  const item: CollectionPath = {
    ...input,
    pkey,
    pkeyByCollection,
    model,
    id,
    timestamp: Date.now(),
    collectionId,
    path,
  };
  return item;
}
