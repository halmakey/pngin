import prompts from "prompts";
import { putSecrets } from "./common/secrets-manager.mjs";

const args = process.argv.slice(2);

let secretIds: string[] = [];
let secretId: string | undefined;
while ((secretId = args.shift())) {
  secretIds = [...secretIds, secretId];
}

if (secretIds.length === 0) {
  process.exit(1);
}

const { botToken } = await prompts({
  type: "text",
  message: "Discord Bot Token:",
  name: "botToken",
  validate: (token) => !!token
});

if (!botToken) {
  process.exit(1);
}

const { clientSecret } = await prompts({
  type: "password",
  message: "Discord Client Secret:",
  name: "clientSecret",
  validate: (secret) => !!secret,
});

if (!clientSecret) {
  process.exit(1);
}

for (const secretId of secretIds) {
  console.log("Putting discord secrets to " + secretId);

  await putSecrets(
    secretId,
    {
      DISCORD_OAUTH_CLIENT_ID: clientId,
      DISCORD_OAUTH_CLIENT_SECRET: clientSecret,
    }
  );
}
