import { CollectionModel } from "@/models";
import { UserAPI } from "@/utils/api";
import { isValidatorError } from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        return await getCollection(req, res);
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

const getCollection = async (
  req: NextApiRequest,
  res: NextApiResponse<UserAPI.GetCollectionsReponseBody>
) => {
  const collections = await CollectionModel.listAllCollection();
  res.json({ collections });
};
