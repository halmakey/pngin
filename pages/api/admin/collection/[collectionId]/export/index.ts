import { withAdmin } from "@/utils/api-server/with-user";
import {
  isValidatorError,
  nanoIDValidator,
  objectValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { createTransactWrite } from "@/models/dynamodb";
import {
  CollectionModel,
  ExportRequestModel,
  ExportResultModel,
} from "@/models";
import { getSQSAppClient } from "@/utils/api-server/shared";
import { AdminAPI } from "@/utils/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res);
      case "POST":
        return await handlePost(req, res);
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

const handleGet = withAdmin<AdminAPI.GetExportsResponse>(
  async (req, res, user) => {
    const { collectionId } = objectValidator.with({
      collectionId: nanoIDValidator,
    })(req.query, "query");

    const [exportRequests, exportResults] = await Promise.all([
      ExportRequestModel.findExportRequestsByCollection(collectionId),
      ExportResultModel.findExportResultsByCollection(collectionId),
    ]);
    res.json({ exportRequests, exportResults });
  }
);

const handlePost = withAdmin<AdminAPI.PostExportRequestResponse>(
  async (req, res, user) => {
    const { collectionId } = objectValidator.with({
      collectionId: nanoIDValidator,
    })(req.query, "query");

    const collection = CollectionModel.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({});
    }

    const exportRequest = ExportRequestModel.createExportRequest({
      collectionId,
    });
    await createTransactWrite().put(exportRequest).write();
    await getSQSAppClient().sendMessage(exportRequest.id);

    res.json({ exportRequest });
  }
);
