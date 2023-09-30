import crypto from "crypto";
import { putSecrets } from "./common/secrets-manager.mjs";

const SECRET_ID = "pngin-session-secrets";

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-521" },
  true,
  ["sign", "verify"]
);

const jwkPrivateKey = Buffer.from(
  JSON.stringify(await crypto.subtle.exportKey("jwk", privateKey))
).toString("base64url");

const jwkPublicKey = Buffer.from(
  JSON.stringify(await crypto.subtle.exportKey("jwk", publicKey))
).toString("base64url");

console.log("Putting key pair to " + SECRET_ID);

await putSecrets(SECRET_ID, {
  jwkPrivateKey, //PNGIN_JWT_PRIVATE_KEY
  jwkPublicKey, //PNGIN_JWT_PUBLIC_KEY
});
