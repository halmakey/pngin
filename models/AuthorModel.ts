import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import { getDocument, InputSource, TableName } from "./dynamodb";
import { UserID } from "./UserModel";
import Model, {
  ByCollectionIndexName,
  ByModelIndexName,
  ByUserIndexName,
} from "./Model";

export const model = "author" as const;
export type AuthorID = `${string}.${string}`;
export type PKey = `author:${AuthorID}`;
export type PKeyByCollection = `author:${string}`;
export type PKeyByUser = `author:${UserID}`;

export interface Author extends Model<typeof model, PKey, AuthorID> {
  pkeyByCollection: PKeyByCollection;
  pkeyByUser: PKeyByUser;
  collectionId: string;
  userId: UserID;
  name: string;
  comment: string;
  imageId: string;
}

export function getPKey(authorId: AuthorID): PKey {
  return `author:${authorId}`;
}

export function getPKeyByCollection(collectionId: string): PKeyByCollection {
  return `author:${collectionId}`;
}

export function getPKeyByUser(userId: UserID): PKeyByCollection {
  return `author:${userId}`;
}

export function getAuthorID(collectionId: string, userId: string): AuthorID {
  return `${collectionId}.${userId}`;
}

export function getIdsFromAuthorID(authorId: AuthorID) {
  const ids = authorId.split(".");
  return {
    collectionId: ids[0],
    userId: ids[1],
  };
}

export async function listAllAuthors() {
  let authors: Author[] = [];
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
        ":model": "author",
      },
    }
  );
  for await (const page of pages) {
    authors = [...authors, ...(page.Items as Author[])];
  }
  return authors;
}

export async function getAuthor(
  authorId: AuthorID
): Promise<Author | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: { pkey: getPKey(authorId) },
  });
  return result.Item as Author;
}

export function createAuthorItem(
  collectionId: string,
  userId: string,
  input: InputSource<Author, "collectionId" | "userId">
) {
  const id = getAuthorID(collectionId, userId);
  const pkey = getPKey(id);
  const pkeyByCollection = getPKeyByCollection(collectionId);
  const pkeyByUser = getPKeyByUser(userId);
  const author: Author = {
    ...input,
    pkey,
    pkeyByCollection,
    pkeyByUser,
    id,
    userId,
    collectionId,
    model,
    timestamp: Date.now(),
  };
  return author;
}

export async function findAuthorsByCollection(
  collectionId: string,
  {
    indexForward = true,
  }: {
    indexForward?: boolean;
  } = {}
) {
  const pkeyByCollection = getPKeyByCollection(collectionId);
  let authors: Author[] = [];
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
      ScanIndexForward: indexForward,
    }
  );
  for await (const page of pages) {
    authors = [...authors, ...(page.Items as Author[])];
  }
  return authors;
}

export async function findAuthorsByUser(
  userId: string,
  {
    indexForward = true,
  }: {
    indexForward?: boolean;
  } = {}
) {
  const pkeyByUser = getPKeyByUser(userId);
  let authors: Author[] = [];
  const pages = paginateQuery(
    {
      client: getDocument(),
    },
    {
      TableName,
      IndexName: ByUserIndexName,
      KeyConditions: {
        pkeyByUser: {
          AttributeValueList: [pkeyByUser],
          ComparisonOperator: "EQ",
        },
      },
      ScanIndexForward: indexForward,
    }
  );
  for await (const page of pages) {
    authors = [...authors, ...(page.Items as Author[])];
  }
  return authors;
}
