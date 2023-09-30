import { checkAllEnvs } from "@/utils/check-env";
import { NextApiRequest, NextApiResponse } from "next";
import { getRemoteIp } from "@/utils/remoteip";
import { withUser } from "@/utils/api-server/with-user";
import { withRecaptcha } from "@/utils/api-server/with-recaptcha";
import { getS3AppClient } from "@/utils/api-server/shared";
import { createTransactWrite, updateTimestamp } from "@/models/dynamodb";
import {
  arrayValidator,
  isValidatorError,
  nanoIDValidator,
  numberValidator,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { getObjectName } from "@/utils/s3-app-client";
import {
  CollectionModel,
  AuthorModel,
  SubmissionModel,
  CollectionPathModel,
  RejectModel,
} from "@/models";
import { UserAPI } from "@/utils/api";
import { MAX_SUBMISSIONS_PER_AUTHOR } from "@/components/submission/constants";

checkAllEnvs();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "PUT":
        return await putAuthorSubmissions(req, res);
      case "DELETE":
        return await deleteAuthorSubmissions(req, res);
    }
    return res.status(405).json({});
  } catch (err) {
    if (isValidatorError(err)) {
      console.warn(err);
      return res.status(400).json({});
    }
    console.error(err);
    return res.status(500).json({});
  }
}

const putAuthorSubmissions = withRecaptcha(
  "submit",
  withUser<UserAPI.PutAuthorSubmissionsResponse | { [key: string]: never }>(
    async (req, res, user) => {
      const body = objectValidator.with({
        token: stringValidator.default,
        collectionId: nanoIDValidator,
        author: objectValidator.with({
          name: stringValidator.range(1, 64),
          comment: stringValidator.range(0, 512),
          imageId: nanoIDValidator,
        }),
        submissions: arrayValidator.with(
          objectValidator.select(
            {
              imageId: nanoIDValidator,
              comment: stringValidator.range(0, 512),
              width: numberValidator.exact(1920),
              height: numberValidator.select(1920),
            },
            {
              imageId: nanoIDValidator,
              comment: stringValidator.range(0, 512),
              width: numberValidator.exact(1920),
              height: numberValidator.select(1080),
            },
            {
              imageId: nanoIDValidator,
              comment: stringValidator.range(0, 512),
              width: numberValidator.exact(1080),
              height: numberValidator.select(1920),
            }
          ),
          1,
          MAX_SUBMISSIONS_PER_AUTHOR
        ),
      })(req.body, "body");

      const collection = await CollectionModel.getCollection(body.collectionId);
      if (!collection) {
        return res.status(404).json({});
      }

      if (body.submissions.length > collection.submissionsPerAuthor) {
        return res.status(400).json({});
      }

      const tx = createTransactWrite();
      const deletingObjects: string[] = [];

      // resolve author
      const authorId = AuthorModel.getAuthorID(body.collectionId, user.id);
      const [prevAuthor, reject] = await Promise.all([
        AuthorModel.getAuthor(authorId),
        RejectModel.getReject(authorId),
      ]);

      const canSubmit = collection.formActive || reject;
      if (!canSubmit) {
        return res.status(400).json({});
      }

      let nextAuthor: AuthorModel.Author;
      if (prevAuthor) {
        nextAuthor = updateTimestamp({
          ...prevAuthor,
          name: body.author.name,
          comment: body.author.comment,
          imageId: body.author.imageId,
        });
      } else {
        nextAuthor = AuthorModel.createAuthorItem(body.collectionId, user.id, {
          name: body.author.name,
          comment: body.author.comment,
          imageId: body.author.imageId,
        });
      }
      tx.put(nextAuthor);

      // resolve author image
      if (prevAuthor?.imageId != nextAuthor.imageId) {
        const exist = await getS3AppClient().headObject(
          getObjectName(nextAuthor.imageId)
        );
        if (!exist) {
          throw new Error("image not found: " + nextAuthor.imageId);
        }

        if (prevAuthor?.imageId) {
          deletingObjects.push(getObjectName(prevAuthor.imageId));
        }
      }

      // resolve submissions
      let prevSubmissions = await SubmissionModel.findSubmissionsByAuthor(
        nextAuthor.id
      );
      const nextSubmissions: SubmissionModel.Submission[] = [];
      for (let index = 0; index < body.submissions.length; index++) {
        const { imageId, comment, width, height } = body.submissions[index];
        const submissionId = SubmissionModel.getSubmissionId(
          nextAuthor.id,
          imageId
        );
        let submission = prevSubmissions.find((s) => s.id === submissionId);

        if (submission) {
          prevSubmissions = prevSubmissions.filter(
            (s) => s.id !== submission!.id
          );
          submission.sequence = index;
          submission.comment = comment;
          submission.width = width;
          submission.height = height;
          submission.timestamp = Date.now();
        } else {
          submission = SubmissionModel.createSubmissionItem({
            sequence: index,
            collectionId: collection.id,
            authorId: nextAuthor.id,
            imageId,
            comment,
            width,
            height,
          });
        }
        nextSubmissions.push(submission);
        tx.put(submission);

        // check submission image
        const exist = await getS3AppClient().headObject(getObjectName(imageId));
        if (!exist) {
          throw new Error(`unexpected submission image unexists ${imageId}`);
        }
      }

      // resolve prev submissions
      for (const submission of prevSubmissions) {
        tx.delete(submission.pkey);
        deletingObjects.push(getObjectName(submission.imageId));
      }
      const collectionPaths =
        await CollectionPathModel.findCollectionPathsByCollection(
          body.collectionId
        );
      const prevSubmissionIds = prevSubmissions.map((s) => s.id);
      for (const collectionPath of collectionPaths) {
        const filtered = collectionPath.submissionIds.filter(
          (sid) => !prevSubmissionIds.includes(sid)
        );
        if (filtered.length === collectionPath.submissionIds.length) {
          continue;
        }
        collectionPath.submissionIds = filtered;
        collectionPath.timestamp = Date.now();
        tx.put(collectionPath);
      }

      if (reject) {
        const nextImageIds = [
          nextAuthor.imageId,
          ...nextSubmissions.map((s) => s.imageId),
        ];
        reject.imageIds = reject.imageIds.filter((iid) =>
          nextImageIds.includes(iid)
        );
        reject.status = reject.imageIds.length ? "reject" : "review";
        reject.timestamp = Date.now();
        tx.put(reject);
      }

      await tx.write();
      Promise.all(
        deletingObjects.map((objectName) =>
          getS3AppClient().deleteObject(objectName)
        )
      );

      return res.json({
        author: nextAuthor,
        submissions: nextSubmissions,
      });
    }
  )
);

const deleteAuthorSubmissions = withRecaptcha(
  "delete",
  withUser(async (req, res, user) => {
    const { collectionId } = objectValidator.with({
      token: stringValidator.default,
      collectionId: nanoIDValidator,
    })(req.body, "body");
    const remoteip = getRemoteIp(req);
    const collection = await CollectionModel.getCollection(collectionId);
    const authorId = AuthorModel.getAuthorID(collectionId, user.id);
    const author = collectionId && (await AuthorModel.getAuthor(authorId));
    const submissions =
      author && (await SubmissionModel.findSubmissionsByAuthor(author.id));
    const reject = author && (await RejectModel.getReject(author.id));
    if (!collection || !remoteip || !author || !submissions) {
      return res.status(400).json({});
    }

    const canSubmit = collection.formActive || reject;
    if (!canSubmit) {
      return res.status(400).json({});
    }

    const tx = createTransactWrite();
    const deletingObjects: string[] = [];

    // resolve author
    tx.delete(author.pkey);
    deletingObjects.push(getObjectName(author.imageId));

    // resolve submissions
    for (const submission of submissions) {
      tx.delete(submission.pkey);
      deletingObjects.push(getObjectName(submission.imageId));
    }
    const submissionIds = submissions.map((s) => s.id);
    const collectionPaths =
      await CollectionPathModel.findCollectionPathsByCollection(collectionId);
    for (const collectionPath of collectionPaths) {
      const filtered = collectionPath.submissionIds.filter(
        (sid) => !submissionIds.includes(sid)
      );
      if (filtered.length === collectionPath.submissionIds.length) {
        continue;
      }
      collectionPath.submissionIds = filtered;
      collectionPath.timestamp = Date.now();
      tx.put(collectionPath);
    }

    tx.delete(RejectModel.getPKey(authorId));

    await tx.write();
    Promise.all(
      deletingObjects.map((objectName) =>
        getS3AppClient().deleteObject(objectName)
      )
    );

    res.json({});
  })
);

export default handler;
