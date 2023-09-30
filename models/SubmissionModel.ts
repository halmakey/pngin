import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import type { AuthorID } from "./AuthorModel";
import { getDocument, InputSource, TableName } from "./dynamodb";
import Model, {
  ByAuthorSequenceIndexName,
  ByCollectionIndexName,
  ByModelIndexName,
} from "./Model";

export const model = "submission" as const;
export type SubmissionID = `${AuthorID}.${string}`;
export type PKey = `submission:${string}`;
export type PKeyByCollection = `submission:${string}`;
export type PKeyByAuthor = `submission:${AuthorID}`;

export interface Submission extends Model<typeof model, PKey, SubmissionID> {
  pkeyByCollection: PKeyByCollection;
  pkeyByAuthor: PKeyByAuthor;
  sequence: number;
  collectionId: string;
  authorId: AuthorID;
  imageId: string;
  comment: string;
  width: number;
  height: number;
}

function getPKey(submissionId: SubmissionID): PKey {
  return `submission:${submissionId}`;
}
export function getSubmissionId(
  authorId: AuthorID,
  imageId: string
): SubmissionID {
  return `${authorId}.${imageId}`;
}
function getPKeyByCollection(collectionId: string): PKeyByCollection {
  return `submission:${collectionId}`;
}
function getPKeyByAuthor(authorId: AuthorID): PKeyByAuthor {
  return `submission:${authorId}`;
}

export function getIdsFromSubmission(submissionId: SubmissionID): {
  collectionId: string;
  userId: string;
  imageId: string;
} {
  const [_, collectionId, userId, imageId] = submissionId.match(
    /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/
  )!;
  return { collectionId, userId, imageId };
}

export async function getSubmission(
  submissionId: SubmissionID
): Promise<Submission | undefined> {
  const result = await getDocument().get({
    TableName,
    Key: { pkey: getPKey(submissionId) },
  });
  return result.Item as Submission;
}

export function createSubmissionItem({
  sequence,
  collectionId,
  authorId,
  imageId,
  width,
  height,
  comment,
}: InputSource<Submission>) {
  const id = getSubmissionId(authorId, imageId);
  const pkey = getPKey(id);
  const pkeyByCollection = getPKeyByCollection(collectionId);
  const pkeyByAuthor = getPKeyByAuthor(authorId);
  const item: Submission = {
    pkey,
    pkeyByCollection,
    pkeyByAuthor,
    model,
    id,
    sequence,
    collectionId,
    authorId,
    imageId,
    width,
    height,
    timestamp: Date.now(),
    comment,
  };
  return item;
}

export async function findSubmissionsByCollection(
  collectionId: string,
  {
    indexForward = true,
  }: {
    indexForward?: boolean;
  } = {}
) {
  const pkeyByCollection = getPKeyByCollection(collectionId);
  let submissions: Submission[] = [];
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
    submissions = [...submissions, ...(page.Items as Submission[])];
  }
  return submissions;
}

export async function findSubmissionsByAuthor(authorId: AuthorID) {
  let submissions: Submission[] = [];
  const pkeyByAuthor = getPKeyByAuthor(authorId);
  const pages = paginateQuery(
    {
      client: getDocument(),
    },
    {
      TableName,
      IndexName: ByAuthorSequenceIndexName,
      KeyConditions: {
        pkeyByAuthor: {
          AttributeValueList: [pkeyByAuthor],
          ComparisonOperator: "EQ",
        },
      },
    }
  );
  for await (const page of pages) {
    submissions = [...submissions, ...(page.Items as Submission[])];
  }
  return submissions;
}

export async function listAllSubmissions() {
  let submissions: Submission[] = [];
  const pages = paginateQuery(
    {
      client: getDocument(),
    },
    {
      TableName,
      IndexName: ByModelIndexName,
      KeyConditionExpression: "#model = :model",
      ExpressionAttributeValues: {
        ":model": "submission",
      },
      ExpressionAttributeNames: {
        "#model": "model",
      },
    }
  );
  for await (const page of pages) {
    submissions = [...submissions, ...(page.Items as Submission[])];
  }

  return submissions;
}
