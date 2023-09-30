import { withAdmin } from "@/utils/api-server/with-user";
import {
  arrayValidator,
  isValidatorError,
  nanoIDValidator,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { createTransactWrite } from "@/models/dynamodb";
import { CollectionPathModel } from "@/models";
import { SubmissionID } from "@/models/SubmissionModel";
import { AdminAPI } from "@/utils/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "PUT":
        return await putSubmisisonPath(req, res);
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

const putSubmisisonPath = withAdmin<AdminAPI.PutSubmissionPathsResponse>(
  async (req, res, user) => {
    const { path, submissionIds } = objectValidator.with({
      path: stringValidator.range(0, 1024),
      submissionIds: arrayValidator.with(
        stringValidator.range<SubmissionID>(1, 1024)
      ),
    })(req.body, "body");
    const { collectionId } = objectValidator.with({
      collectionId: nanoIDValidator,
    })(req.query, "query");

    const collectionPaths =
      await CollectionPathModel.findCollectionPathsByCollection(collectionId);
    let targetCollectionPath = collectionPaths.find((p) => p.path === path);
    if (!targetCollectionPath && !path) {
      targetCollectionPath = CollectionPathModel.createCollectionPathItem(
        collectionId,
        path,
        {
          submissionIds: [],
          sequence: 0,
        }
      );
    }
    if (!targetCollectionPath) {
      return res.status(404).json({});
    }

    const tx = createTransactWrite();

    // remove all targets from old paths
    for (const collectionPath of collectionPaths) {
      if (collectionPath.id === targetCollectionPath.id) {
        continue;
      }
      const filtered = collectionPath.submissionIds.filter(
        (sid) => !submissionIds.includes(sid)
      );
      if (filtered.length === collectionPath.submissionIds.length) {
        continue;
      }
      collectionPath.submissionIds = filtered;
      collectionPath.timestamp = Date.now();
      if (collectionPath.id !== targetCollectionPath.id) {
        tx.put(collectionPath);
      }
    }

    targetCollectionPath.submissionIds = Array.from(
      new Set([...targetCollectionPath.submissionIds, ...submissionIds])
    );
    targetCollectionPath.timestamp = Date.now();
    tx.put(targetCollectionPath);

    await tx.write();

    res.json({ collectionPaths });
  }
);
