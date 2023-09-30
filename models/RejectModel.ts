import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import { AuthorID, getIdsFromAuthorID } from "./AuthorModel";
import { getDocument, TableName } from "./dynamodb";
import Model, { ByCollectionIndexName, ByModelIndexName } from "./Model";
import { UserID } from "./UserModel";

export const model = "reject" as const;
export type PKey = `reject:${AuthorID}`;
export type PKeyByCollection = `reject:${string}`;

export type RejectStatus = "reject" | "review";

export interface Reject extends Model<typeof model, PKey, AuthorID> {
  pkeyByCollection: PKeyByCollection;
  collectionId: string;
  authorId: AuthorID;
  status: RejectStatus;
  message: string;
  imageIds: string[];
  reviewer: UserID;
}

export function getPKey(authorId: AuthorID): PKey {
  return `reject:${authorId}`;
}
function getPKeyByCollection(collectionId: string): PKeyByCollection {
  return `reject:${collectionId}`;
}

export async function getReject(
  authorId: AuthorID
): Promise<Reject | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: { pkey: getPKey(authorId) },
  });
  return result.Item as Reject;
}

export function createReject(
  authorId: AuthorID,
  {
    message,
    status,
    imageIds,
    reviewer,
  }: {
    message: string;
    status: RejectStatus;
    imageIds: string[];
    reviewer: UserID;
  }
) {
  const id = authorId;
  const { collectionId } = getIdsFromAuthorID(authorId);
  const pkey = getPKey(id);
  const pkeyByCollection = getPKeyByCollection(collectionId);
  const item: Reject = {
    pkey,
    pkeyByCollection,
    model,
    id,
    collectionId,
    authorId,
    timestamp: Date.now(),
    message,
    status,
    imageIds,
    reviewer,
  };
  return item;
}

export async function findRejectsByCollection(
  collectionId: string,
  {
    indexForward = true,
  }: {
    indexForward?: boolean;
  } = {}
) {
  const pkeyByCollection = getPKeyByCollection(collectionId);
  let rejects: Reject[] = [];
  const pages = paginateQuery(
    { client: getDocument() },
    {
      TableName,
      IndexName: ByCollectionIndexName,
      KeyConditions: {
        pkeyByCollection: {
          AttributeValueList: [pkeyByCollection],
          ComparisonOperator: "EQ",
        },
      },
      ScanIndexForward: indexForward,
    }
  );
  for await (const page of pages) {
    rejects = [...rejects, ...(page.Items as Reject[])];
  }
  return rejects;
}

export async function listAllRejects() {
  let rejects: Reject[] = [];
  const pages = paginateQuery(
    {
      client: getDocument(),
    },
    {
      TableName,
      IndexName: ByModelIndexName,
      KeyConditionExpression: "#model = :model",
      ExpressionAttributeValues: {
        ":model": "reject",
      },
      ExpressionAttributeNames: {
        "#model": "model",
      },
    }
  );
  for await (const page of pages) {
    rejects = [...rejects, ...(page.Items as Reject[])];
  }

  return rejects;
}
