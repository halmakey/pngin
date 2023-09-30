import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export type SQSAppClient = ReturnType<typeof createSQSClient>;

export function createSQSClient({
  region,
  accessKeyId,
  secretAccessKey,
  queueUrl,
}: {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  queueUrl: string;
}) {
  const client = new SQSClient(
    region && accessKeyId && secretAccessKey
      ? {
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        }
      : {}
  );
  return {
    async sendMessage(message: string) {
      const result = await client.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: message,
        })
      );
      return result;
    },
  };
}
