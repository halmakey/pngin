#!/usr/bin/env -S npx tsx

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  AuthorModel,
  CollectionModel,
  CollectionPathModel,
  SubmissionModel,
  UserModel,
} from "@/models";
import { createTransactWrite } from "@/models/dynamodb";
import { createS3AppClient } from "@/utils/s3-app-client";
import { argv } from "process";

const imageBucket = createS3AppClient({
  bucketName: process.env.PNGIN_IMAGE_BUCKET_NAME!,
});

(async () => {
  const collectionId = argv.slice(2).shift();
  const collection =
    collectionId && (await CollectionModel.getCollection(collectionId));
  if (!collectionId || !collection) {
    console.error("Run with valid collectionId");
    return;
  }

  const paths = await CollectionPathModel.findCollectionPathsByCollection(
    collectionId
  );
  const allAuthors = await AuthorModel.findAuthorsByCollection(collectionId);
  const testAuthors = allAuthors.filter((author) =>
    author.id.startsWith(collectionId + ".test-user-")
  );

  for (const author of testAuthors) {
    const tx = createTransactWrite();

    const submissions = await SubmissionModel.findSubmissionsByAuthor(
      author.id
    );
    await imageBucket.deleteObject(author.imageId + ".png");
    for (const submission of submissions) {
      await imageBucket.deleteObject(submission.imageId + ".png");
      tx.delete(submission.pkey);
    }
    tx.delete(UserModel.getPKey(author.userId));
    tx.delete(author.pkey);

    const deletionSubmissionIds = submissions.map((s) => s.id);
    for (const path of paths) {
      const submissionIds = path.submissionIds.filter(
        (sid) => !deletionSubmissionIds.includes(sid)
      );
      if (submissionIds.length < path.submissionIds.length) {
        path.submissionIds = submissionIds;
        path.timestamp = Date.now();
        tx.put(path);
      }
    }
    await tx.write();
  }
})();
