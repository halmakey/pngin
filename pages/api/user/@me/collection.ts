import { checkAllEnvs } from "@/utils/check-env";
import { NextApiRequest, NextApiResponse } from "next";
import { withUser } from "@/utils/api-server/with-user";
import { AuthorModel, CollectionModel } from "@/models";
import { UserAPI } from "@/utils/api";

checkAllEnvs();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      return await handleGet(req, res);
    }
    return res.status(405).json({});
  } catch (err) {
    console.error(err);
    return res.status(500).json({});
  }
}

const handleGet = withUser<
  UserAPI.GetMyCollectionsResponse | { [key: string]: never }
>(async (_, res, user) => {
  const authors = await AuthorModel.findAuthorsByUser(user.id);
  const collections = await CollectionModel.getCollections(
    ...authors.map((a) => a.collectionId)
  );
  return res.json({ collections });
});

export default handler;
