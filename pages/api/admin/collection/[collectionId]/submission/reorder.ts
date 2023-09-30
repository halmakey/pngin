import { withAdmin } from "@/utils/api-server/with-user";
import {
  arrayValidator,
  isValidatorError,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { createTransactWrite } from "@/models/dynamodb";
import { CollectionPathModel, SubmissionModel } from "@/models";
import { SubmissionID } from "@/models/SubmissionModel";
import { AdminAPI } from "@/utils/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "POST":
        return await reorder(req, res);
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

const reorder = withAdmin<AdminAPI.PostSubmissionReorderResponse>(
  async (req, res) => {
    const { path, primary, fromSubmissions, toSubmission } =
      objectValidator.with({
        path: stringValidator.range(0, 1024),
        primary: stringValidator.range(0, 1024),
        fromSubmissions: arrayValidator.with(
          stringValidator.range<SubmissionID>(1, 1024),
          0,
          4096
        ),
        toSubmission: stringValidator.range<SubmissionID>(1, 1024),
      })(req.body, "body");
    const { collectionId } = objectValidator.with({
      collectionId: stringValidator.range(0, 1024),
    })(req.query, "query");

    let collectionPath = await CollectionPathModel.getCollectionPath(
      collectionId,
      path
    );
    if (!collectionPath) {
      collectionPath = CollectionPathModel.createCollectionPathItem(
        collectionId,
        path,
        { submissionIds: [], sequence: 0 }
      );
    }
    let submissionIds = collectionPath.submissionIds.slice();
    if (!path) {
      // Add orphans only when root
      const [submissions, collectionPaths] = await Promise.all([
        SubmissionModel.findSubmissionsByCollection(collectionId),
        CollectionPathModel.findCollectionPathsByCollection(collectionId),
      ]);
      let orphans = submissions.map((s) => s.id);
      for (const collectionPath of collectionPaths) {
        orphans = orphans.filter(
          (sid) => !collectionPath.submissionIds.includes(sid)
        );
      }
      submissionIds = [...submissionIds, ...orphans];
    }

    let safeFromSubmissions = submissionIds.filter((sid) =>
      fromSubmissions.includes(sid)
    );
    let safeFromIndexes = safeFromSubmissions.map((sid) =>
      submissionIds.indexOf(sid)
    );
    const primaryIndex = submissionIds.indexOf(primary);
    const toIndex = submissionIds.indexOf(toSubmission);

    if (safeFromIndexes.includes(toIndex)) {
      // reorder into selection
      safeFromSubmissions = [primary];
      safeFromIndexes = [primaryIndex];
    }

    if (
      primaryIndex === -1 ||
      safeFromIndexes.length === 0 ||
      !safeFromIndexes.includes(primaryIndex) ||
      toIndex === -1
    ) {
      return res.json({ collectionPath });
    }

    const offset = safeFromIndexes.reduce(
      (p, c) => (c < toIndex ? p - 1 : p),
      toIndex - primaryIndex + (toIndex > primaryIndex ? 1 : 0)
    );
    submissionIds = submissionIds.filter(
      (_, index) => !safeFromIndexes.includes(index)
    );
    submissionIds.splice(primaryIndex + offset, 0, ...safeFromSubmissions);

    collectionPath.submissionIds = submissionIds;
    collectionPath.timestamp = Date.now();

    await createTransactWrite().put(collectionPath).write();

    res.json({ collectionPath });
  }
);
