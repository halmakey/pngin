import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { argv } from "process";

const args = argv.slice(2);

const env = args.shift();

if (!env || !["dev", "prod"].includes(env)) {
  process.exit(1);
}

const secretEnvs = {
  ["pngin-app-secret-" + env]: {
    region: "PNGIN_AWS_REGION",
    accessKeyId: "PNGIN_AWS_ACCESS_KEY_ID",
    secretAccessKey: "PNGIN_AWS_SECRET_ACCESS_KEY",
    imageOrigin: "NEXT_PUBLIC_IMAGE_ORIGIN",
    thumbnailOrigin: "NEXT_PUBLIC_THUMBNAIL_ORIGIN",
    exportOrigin: "NEXT_PUBLIC_EXPORT_ORIGIN",
    exportDistributionId: "PNGIN_EXPORT_DISTRIBUTION_ID",
    exportSqsUrl: "PNGIN_EXPORT_SQS_URL",
    imageBucketName: "PNGIN_IMAGE_BUCKET_NAME",
    thumbnailBucketName: "PNGIN_THUMBNAIL_BUCKET_NAME",
    exportBucketName: "PNGIN_EXPORT_BUCKET_NAME",
    cacheBucketName: "PNGIN_CACHE_BUCKET_NAME",
    tableName: "PNGIN_TABLE_NAME",
  },
  "pngin-session-secrets": {
    jwkPrivateKey: "PNGIN_JWT_PRIVATE_KEY",
    jwkPublicKey: "PNGIN_JWT_PUBLIC_KEY",
  },
  "pngin-external-secrets": {
    discordOAuth2ClientId: "DISCORD_OAUTH_CLIENT_ID",
    discordOAuth2ClientSecret: "DISCORD_OAUTH_CLIENT_SECRET",
    recaptchaSiteKey: "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
    recaptchaSecretKey: "RECAPTCHA_SECRET_KEY",
  },
};

const client = new SecretsManagerClient({});

for (const secretId of Object.keys(secretEnvs)) {
  const keyEnvs = secretEnvs[secretId];

  const { SecretString: secretString } = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    })
  );
  const secrets = JSON.parse(secretString!);
  for (const key of Object.keys(keyEnvs)) {
    console.log(keyEnvs[key] + "=" + (secrets[key] || ""));
  }
}
