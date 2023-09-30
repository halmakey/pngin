import { withAdmin } from "@/utils/api-server/with-user";
import {
  isValidatorError,
  nanoIDValidator,
  objectValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { UserModel } from "@/models";
import { AdminAPI } from "@/utils/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        return await get(req, res);
      default:
        return res.status(405).json({});
    }
  } catch (err) {
    if (isValidatorError(err)) {
      console.warn(err);
      return res.status(400).json({});
    }
    console.error(err);
    return res.status(500).json({});
  }
}

const get = withAdmin<AdminAPI.GetUserResponse>(async (req, res) => {
  const { userId } = objectValidator.with({
    userId: nanoIDValidator,
  })(req.query, "query");

  const user = await UserModel.getUser(userId);
  if (!user) {
    return res.status(404).json({});
  }

  res.json({ user });
});
