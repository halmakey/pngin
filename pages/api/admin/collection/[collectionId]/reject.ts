import { withAdmin } from "@/utils/api-server/with-user";
import {
  isValidatorError,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { RejectModel } from "@/models";
import { AdminAPI } from "@/utils/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res);
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

const handleGet = withAdmin<AdminAPI.GetCollectionRejectsResponse>(
  async (req, res) => {
    const { collectionId } = objectValidator.with({
      collectionId: stringValidator.range(0, 1024),
    })(req.query, "query");

    const rejects = await RejectModel.findRejectsByCollection(collectionId);

    res.json({ rejects });
  }
);
