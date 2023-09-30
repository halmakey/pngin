import { checkAllEnvs } from "@/utils/check-env";
import { NextApiRequest, NextApiResponse } from "next";
import { withUser } from "@/utils/api-server/with-user";
import { UserAPI } from "@/utils/api";

checkAllEnvs();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      return await getMe(req, res);
    }
    return res.status(405).json({});
  } catch (err) {
    console.error(err);
    return res.status(500).json({});
  }
}

const getMe = withUser<UserAPI.GetMeResponse | { [key: string]: never }>(
  async (_, res, user) => {
    return res.json({ user });
  }
);

export default handler;
