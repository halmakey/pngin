import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocument,
  TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import "@/utils/ensure-server-side";

export let TableName = process.env.PNGIN_TABLE_NAME as string;

export type InputSource<T, O extends keyof T = never> = Omit<
  T,
  `pkey${string}` | "model" | "id" | "timestamp" | O
>;

const useEnv =
  process.env.PNGIN_AWS_REGION &&
  process.env.PNGIN_AWS_ACCESS_KEY_ID &&
  process.env.PNGIN_AWS_SECRET_ACCESS_KEY;

let client: DynamoDBClient;
function getClient() {
  if (client) {
    return client;
  }
  TableName = process.env.PNGIN_TABLE_NAME!;
  client = new DynamoDBClient(
    useEnv
      ? {
          region: process.env.PNGIN_AWS_REGION,
          credentials: {
            accessKeyId: process.env.PNGIN_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.PNGIN_AWS_SECRET_ACCESS_KEY!,
          },
        }
      : {}
  );
  return client;
}

let document: DynamoDBDocument;
export function getDocument() {
  if (document) {
    return document;
  }
  document = DynamoDBDocument.from(getClient());
  return document;
}

export interface TransactWrite {
  put(item: object, condition?: "exists" | "noexists"): TransactWrite;
  delete(pkey: string): TransactWrite;
  write(): Promise<void>;
  readonly count: number;
}

export function createTransactWrite(): TransactWrite {
  let writes: Exclude<TransactWriteCommandInput["TransactItems"], undefined> =
    [];

  const transact: TransactWrite = {
    get count() {
      return writes.length;
    },
    put(item, condition) {
      writes.push({
        Put: {
          TableName,
          Item: item,
          ConditionExpression:
            condition === "exists"
              ? "attribute_exists(pkey)"
              : condition === "noexists"
              ? "attribute_not_exists(pkey)"
              : undefined,
        },
      });
      return transact;
    },
    delete(pkey) {
      writes.push({
        Delete: {
          TableName,
          Key: { pkey },
        },
      });
      return transact;
    },
    async write() {
      while (true) {
        const writeParcel = writes.splice(0, 100);
        if (!writeParcel.length) {
          break;
        }
        await getDocument().transactWrite({
          TransactItems: writeParcel,
        });
      }
      writes = [];
    },
  };
  return transact;
}

export function updateTimestamp<T extends object>(value: T): T {
  if ("timestamp" in value) {
    return {
      ...value,
      timestamp: Date.now(),
    };
  }
  throw new Error("timestamp not found");
}
