import { AuthorModel, CollectionModel, RejectModel } from "@/models";
import { UserAPI } from "@/utils/api";
import { withUser } from "@/utils/api-server/with-user";
import {
  isValidatorError,
  nanoIDValidator,
  objectValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";

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

const handleGet = withUser<UserAPI.GetMyRejectResponse>(
  async (req, res, user) => {
    const { collectionId } = objectValidator.with({
      collectionId: nanoIDValidator,
    })(req.query, "query");

    const authorId = AuthorModel.getAuthorID(collectionId, user.id);

    const [collection, reject] = await Promise.all([
      CollectionModel.getCollection(collectionId),
      RejectModel.getReject(authorId),
    ]);

    if (!collection) {
      return res.status(404).json({});
    }

    res.json({ reject: reject ?? null });
  }
);
