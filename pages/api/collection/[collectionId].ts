import { CollectionModel } from "@/models";
import { UserAPI } from "@/utils/api";
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

const handleGet = async (
  req: NextApiRequest,
  res: NextApiResponse<UserAPI.GetCollectionReponseBody | Record<never, never>>
) => {
  const { collectionId } = objectValidator.with({
    collectionId: nanoIDValidator,
  })(req.query, "query");

  const collection = await CollectionModel.getCollection(collectionId);
  if (!collection) {
    return res.status(404).json({});
  }
  res.json({ collection });
};
