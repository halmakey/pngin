import { generateRandomHex } from "@/utils/random";
import { createSessionToken } from "@/utils/token";
import cookie from "cookie";
import { NextApiRequest, NextApiResponse } from "next";
import {
  isValidatorError,
  objectValidator,
  optional,
  stringValidator,
} from "@/utils/validator";
import { discordApp, getAuthRedirectUrl } from "@/utils/api-server/shared";
import { createTransactWrite } from "@/models/dynamodb";
import { SessionModel } from "@/models";

// 1h
const Age1H = 60 * 60;

function validateCallback(path?: string) {
  return typeof path === "string" && path.startsWith("/") ? path : undefined;
}

async function signin(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { callback } = objectValidator.with({
      callback: optional(stringValidator.default),
    })(req.query, "query");
    const nonce = generateRandomHex(32);
    const now = Date.now();

    const transact = createTransactWrite();
    const session = SessionModel.createSessionItem({
      nonce,
      ttl: Math.floor(now / 1000) + Age1H,
    });
    transact.put(session, "noexists");
    await transact.write();

    const redirectUrl = getAuthRedirectUrl(req.headers.host!);
    const state = await createSessionToken(
      session,
      Age1H,
      validateCallback(callback)
    );
    const signInUrl = discordApp.getSignInUrl(state, redirectUrl);

    return res
      .setHeader(
        "Set-Cookie",
        cookie.serialize("token", "", {
          maxAge: 0,
          httpOnly: true,
          secure: true,
          path: "/",
        })
      )
      .redirect(signInUrl);
  } catch (err) {
    if (isValidatorError(err)) {
      console.warn(err);
    } else {
      console.error(err);
    }
    const redirectUrl = getAuthRedirectUrl(req.headers.host!);
    res.redirect(redirectUrl);
  }
}

export default signin;
