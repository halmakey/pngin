import { SignJWT, importJWK, jwtVerify, base64url } from "jose";

const JWT_PRIVATE_KEY = new TextDecoder().decode(
  base64url.decode(process.env.PNGIN_JWT_PRIVATE_KEY!)
);
const JWT_PUBLIC_KEY = new TextDecoder().decode(
  base64url.decode(process.env.PNGIN_JWT_PUBLIC_KEY!)
);

const ES512 = "ES512";

const preparePrivateKey = importJWK(JSON.parse(JWT_PRIVATE_KEY), ES512);
const preparePublicKey = importJWK(JSON.parse(JWT_PUBLIC_KEY), ES512);

export interface SessionPayload {
  id: string;
  nonce: string;
  userId?: string;
}

export async function createSessionToken(
  session: SessionPayload,
  expiresIn: number,
  callback?: string
): Promise<string> {
  const key = await preparePrivateKey;
  const jwt = await new SignJWT({
    session: {
      id: session.id,
      nonce: session.nonce,
      userId: session.userId,
    },
    callback,
  })
    .setProtectedHeader({ alg: ES512, typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(key);

  return jwt;
}

function isSessionPayload(payload: unknown): payload is SessionPayload {
  return (
    !!payload &&
    typeof payload === "object" &&
    "id" in payload &&
    typeof payload.id === "string" &&
    !!payload.id &&
    "nonce" in payload &&
    typeof payload.nonce === "string" &&
    !!payload.nonce &&
    ("userId" in payload
      ? !!payload.userId && typeof payload.userId === "string"
      : true)
  );
}

export async function verifySessionToken(token: string) {
  const key = await preparePublicKey;
  const { payload } = await jwtVerify(token, key, {
    algorithms: [ES512],
  });
  if (isSessionPayload(payload.session)) {
    return payload as { session: SessionPayload; callback?: string };
  }
}
