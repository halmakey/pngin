import { withAdmin } from "@/utils/api-server/with-user";
import {
  arrayValidator,
  isValidatorError,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { createTransactWrite } from "@/models/dynamodb";
import { AuthorModel, CollectionModel, RejectModel } from "@/models";
import { RejectStatus } from "@/models/RejectModel";
import { AuthorID } from "@/models/AuthorModel";
import { AdminAPI } from "@/utils/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res);
      case "PUT":
        return await handlePut(req, res);
      case "DELETE":
        return await handleDelete(req, res);
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

const handleGet = withAdmin<AdminAPI.GetRejectResponse>(async (req, res) => {
  const { authorId } = objectValidator.with({
    authorId: stringValidator.default,
  })(req.query, "query");

  const result = await RejectModel.getReject(authorId as AuthorID);
  res.json({
    reject: result ?? null,
  });
});

const handlePut = withAdmin<AdminAPI.PutRejectResponse>(
  async (req, res, user) => {
    const { authorId } = objectValidator.with({
      authorId: stringValidator.default,
    })(req.query, "query");
    const { imageIds, message, status } = objectValidator.with({
      imageIds: arrayValidator.with(stringValidator.default, 0, 4),
      message: stringValidator.range(0, 100),
      status: stringValidator.enum<RejectStatus>("reject", "review"),
    })(req.body, "body");

    const { collectionId } = AuthorModel.getIdsFromAuthorID(
      authorId as AuthorID
    );
    const collection = await CollectionModel.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({});
    }

    const reject = RejectModel.createReject(authorId as AuthorID, {
      message,
      status,
      imageIds,
      reviewer: user.id,
    });

    await createTransactWrite().put(reject).write();
    res.json({ reject });
  }
);

const handleDelete = withAdmin<Record<never, never>>(async (req, res) => {
  const { authorId } = objectValidator.with({
    authorId: stringValidator.default,
  })(req.query, "query");

  const { collectionId } = AuthorModel.getIdsFromAuthorID(authorId as AuthorID);
  const collection = await CollectionModel.getCollection(collectionId);
  if (!collection) {
    return res.status(404).json({});
  }

  const pkey = RejectModel.getPKey(authorId as AuthorID);
  await createTransactWrite().delete(pkey).write();
  res.json({});
});
