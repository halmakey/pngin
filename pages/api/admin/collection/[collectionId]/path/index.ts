import { withAdmin } from "@/utils/api-server/with-user";
import {
  isValidatorError,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { createTransactWrite } from "@/models/dynamodb";
import { CollectionModel, CollectionPathModel } from "@/models";
import { getParentPath, pathContains } from "@/utils/path-utils";
import { SubmissionID } from "@/models/SubmissionModel";
import { AdminAPI } from "@/utils/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "POST":
        return await postCollectionPath(req, res);
      case "DELETE":
        return await deleteCollectionPath(req, res);
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

const postCollectionPath = withAdmin<AdminAPI.PostCollectionPathResponse>(
  async (req, res, user) => {
    const { path } = objectValidator.with({
      path: stringValidator.range(1, 1024),
    })(req.body, "body");
    const collectionId = req.query.collectionId as string;
    const collection = await CollectionModel.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({});
    }
    const collectionPaths =
      await CollectionPathModel.findCollectionPathsByCollection(collectionId);

    const existingCollectionPath = collectionPaths.find((p) => p.path === path);
    if (existingCollectionPath) {
      return res.json({ collectionPath: existingCollectionPath });
    }

    const sequence =
      collectionPaths.reduce((p, c) => Math.max(c.sequence, p), 0) + 1;
    const collectionPath = CollectionPathModel.createCollectionPathItem(
      collectionId,
      path,
      {
        submissionIds: [],
        sequence,
      }
    );

    await createTransactWrite().put(collectionPath).write();

    res.json({ collectionPath });
  }
);

const deleteCollectionPath = withAdmin<AdminAPI.DeleteCollectionPathResponse>(
  async (req, res, user) => {
    const { path } = objectValidator.with({
      path: stringValidator.range(1, 1024),
    })(req.body, "body");
    const collectionId = req.query.collectionId as string;

    const tx = createTransactWrite();

    const collectionPaths =
      await CollectionPathModel.findCollectionPathsByCollection(collectionId);
    const deletingCollectionPaths = collectionPaths.filter((p) =>
      pathContains(path, p.path)
    );
    const deletingCollectionPathIds = deletingCollectionPaths.map((p) => p.id);

    let movingSubmissionIds: SubmissionID[] = [];
    for (const deletingCollectionPath of deletingCollectionPaths) {
      tx.delete(deletingCollectionPath.pkey);
      movingSubmissionIds = [
        ...movingSubmissionIds,
        ...deletingCollectionPath.submissionIds,
      ];
    }
    const nextCollectionPaths = collectionPaths.filter(
      (p) => !deletingCollectionPathIds.includes(p.id)
    );

    const parentPath = getParentPath(path);
    let parentCollectionPath = nextCollectionPaths.find(
      (p) => p.path === parentPath
    );
    if (!parentCollectionPath) {
      parentCollectionPath = CollectionPathModel.createCollectionPathItem(
        collectionId,
        parentPath,
        {
          submissionIds: [],
          sequence: 0,
        }
      );
    }
    parentCollectionPath.submissionIds = Array.from(
      new Set([...parentCollectionPath.submissionIds, ...movingSubmissionIds])
    );
    parentCollectionPath.timestamp = Date.now();
    tx.put(parentCollectionPath);

    await tx.write();
    res.json({ collectionPaths: nextCollectionPaths });
  }
);
