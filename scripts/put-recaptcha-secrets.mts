import prompts from "prompts";
import { getSecrets, putSecrets } from "./common/secrets-manager.mjs";

const SECRET_ID = "pngin-external-secrets";

const {
  recaptchaSiteKey: initialSiteKey,
  recaptchaSecretKey: initialSecretKey,
} = await getSecrets(SECRET_ID, ["recaptchaSiteKey", "recaptchaSecretKey"]);

const { siteKey } = await prompts({
  type: "text",
  message: "reCAPTCHA v3 Site Key:",
  name: "siteKey",
  initial: initialSiteKey,
  validate: (key) => !!key,
});

if (!siteKey) {
  process.exit(1);
}

const { secretKey } = await prompts({
  type: "password",
  message: "reCAPTCHA v3 Secret Key:",
  name: "secretKey",
  initial: initialSecretKey,
  validate: (key) => !!key,
});

if (!secretKey) {
  process.exit(1);
}

console.log("Putting discord secrets to " + SECRET_ID);
await putSecrets(SECRET_ID, {
  recaptchaSiteKey: siteKey,
  recaptchaSecretKey: secretKey,
});
