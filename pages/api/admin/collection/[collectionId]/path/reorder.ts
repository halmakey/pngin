import { withAdmin } from "@/utils/api-server/with-user";
import {
  isValidatorError,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { createTransactWrite } from "@/models/dynamodb";
import { CollectionPathModel } from "@/models";
import { AdminAPI } from "@/utils/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "POST":
        return await reorderCollectionPath(req, res);
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

const reorderCollectionPath =
  withAdmin<AdminAPI.PostCollectionPathReorderResponse>(
    async (req, res, user) => {
      const { fromPath, toPath } = objectValidator.with({
        fromPath: stringValidator.range(1, 1024),
        toPath: stringValidator.range(1, 1024),
      })(req.body, "body");

      const collectionId = req.query.collectionId as string;

      const collectionPaths =
        await CollectionPathModel.findCollectionPathsByCollection(collectionId);

      const fromIndex = collectionPaths.findIndex((p) => p.path === fromPath);
      const toIndex = collectionPaths.findIndex((p) => p.path === toPath);
      if (fromIndex < 0 || toIndex < 0) {
        return res.json({ collectionPaths });
      }

      const [value] = collectionPaths.splice(fromIndex, 1);
      collectionPaths.splice(toIndex, 0, value);

      const tx = createTransactWrite();

      for (let index = 0; index < collectionPaths.length; index++) {
        const collectionPath = collectionPaths[index];
        collectionPath.sequence = index + 1;
        collectionPath.timestamp = Date.now();
        tx.put(collectionPath);
      }

      await tx.write();

      res.json({ collectionPaths });
    }
  );
