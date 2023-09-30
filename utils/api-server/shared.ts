import { createDiscordApp } from "../discord-app";
import { createS3AppClient, S3AppClient } from "../s3-app-client";
import { createSQSClient, SQSAppClient } from "../sqs-app-client";

export const discordApp = createDiscordApp({
  clientId: process.env.DISCORD_OAUTH_CLIENT_ID!,
  secret: process.env.DISCORD_OAUTH_CLIENT_SECRET!,
});

export function getAuthRedirectUrl(host: string) {
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  return new URL("/api/auth/callback", origin).toString();
}

let s3AppClient: S3AppClient;
export function getS3AppClient() {
  if (s3AppClient) {
    return s3AppClient;
  }
  s3AppClient = createS3AppClient({
    region: process.env.PNGIN_AWS_REGION!,
    accessKeyId: process.env.PNGIN_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.PNGIN_AWS_SECRET_ACCESS_KEY!,
    bucketName: process.env.PNGIN_IMAGE_BUCKET_NAME!,
  });
  return s3AppClient;
}

let sqsClient: SQSAppClient;
export function getSQSAppClient() {
  if (sqsClient) {
    return sqsClient;
  }
  sqsClient = createSQSClient({
    region: process.env.PNGIN_AWS_REGION!,
    accessKeyId: process.env.PNGIN_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.PNGIN_AWS_SECRET_ACCESS_KEY!,
    queueUrl: process.env.PNGIN_EXPORT_SQS_URL!,
  });
  return sqsClient;
}
