import { withAdmin } from "@/utils/api-server/with-user";
import {
  booleanValidator,
  isValidatorError,
  numberValidator,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { createTransactWrite } from "@/models/dynamodb";
import { CollectionModel } from "@/models";
import { AdminAPI } from "@/utils/api";
import { MAX_SUBMISSIONS_PER_AUTHOR } from "@/components/submission/constants";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "PUT":
        return await handlePut(req, res);
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

const handlePut = withAdmin<AdminAPI.PutCollectionResponse>(
  async (req, res) => {
    const { name, sequence, url, formActive, visible, submissionsPerAuthor } =
      objectValidator.with({
        name: stringValidator.range(0, 256),
        sequence: numberValidator.finite,
        url: stringValidator.range(0, 1024),
        formActive: booleanValidator,
        visible: booleanValidator,
        submissionsPerAuthor: numberValidator.range(
          1,
          MAX_SUBMISSIONS_PER_AUTHOR
        ),
      })(req.body, "body");
    const { collectionId } = objectValidator.with({
      collectionId: stringValidator.range(0, 1024),
    })(req.query, "query");

    const collection = await CollectionModel.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({});
    }
    collection.name = name;
    collection.sequence = sequence;
    collection.url = url;
    collection.formActive = formActive;
    collection.visible = visible;
    collection.submissionsPerAuthor = submissionsPerAuthor;
    collection.timestamp = Date.now();

    res.revalidate("/");

    await createTransactWrite().put(collection, "exists").write();
    res.json({ collection });
  }
);
