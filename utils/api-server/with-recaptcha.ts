import { NextApiHandler } from "next";
import { getRemoteIp } from "../remoteip";
import { verifyRecaptchaToken } from "@/utils/verify-recaptcha";
import { isValidatorError, stringValidator } from "../validator";

export function withRecaptcha<R = { [key: string]: never }>(
  action: string,
  handler: NextApiHandler<R | { [key: string]: never }>
): NextApiHandler<R | { [key: string]: never }> {
  return async (req, res) => {
    try {
      const response = stringValidator.default(req.body?.token, "body.token");
      const remoteip = getRemoteIp(req);

      if (!remoteip) {
        return res.status(400).json({});
      }

      const result = await verifyRecaptchaToken({
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response,
        remoteip,
      });
      if (!result.success || result.action !== action) {
        console.error(result);
        return res.status(403).json({});
      }

      return handler(req, res);
    } catch (err) {
      if (isValidatorError(err)) {
        console.warn(err);
        return res.status(400).json({});
      }
      console.error(err);
      res.status(500).json({});
    }
  };
}
