import prompts from "prompts";
import { getSecrets, putSecrets } from "./common/secrets-manager.mjs";

const SECRET_ID = "pngin-external-secrets";

const {
  discordOAuth2ClientId: initialClientId,
  discordOAuth2ClientSecret: initialClientSecret,
} = await getSecrets(SECRET_ID, [
  "discordOAuth2ClientId",
  "discordOAuth2ClientSecret",
]);

const { clientId } = await prompts({
  type: "text",
  message: "Discord Client ID:",
  name: "clientId",
  initial: initialClientId,
  validate: (id) => !!id.match(/^\d+$/),
});

if (!clientId) {
  process.exit(1);
}

const { clientSecret } = await prompts({
  type: "password",
  message: "Discord Client Secret:",
  name: "clientSecret",
  initial: initialClientSecret,
  validate: (secret) => !!secret,
});

if (!clientSecret) {
  process.exit(1);
}

console.log("Putting discord secrets to " + SECRET_ID);

await putSecrets(SECRET_ID, {
  discordOAuth2ClientId: clientId,
  discordOAuth2ClientSecret: clientSecret,
});
