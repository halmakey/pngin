import { withAdmin } from "@/utils/api-server/with-user";
import {
  isValidatorError,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { NextApiRequest, NextApiResponse } from "next";
import { AuthorModel } from "@/models";
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

const handleGet = withAdmin<AdminAPI.GetAuthorResponse>(async (req, res) => {
  const { authorId } = objectValidator.with({
    authorId: stringValidator.default,
  })(req.query, "query");

  const author = await AuthorModel.getAuthor(authorId as AuthorID);
  if (!author) {
    return res.status(404).json({});
  }
  res.json({
    author,
  });
});
