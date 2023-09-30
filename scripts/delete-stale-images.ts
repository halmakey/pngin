#!/usr/bin/env -S npx tsx

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getS3AppClient } from "@/utils/api-server/shared";
import { getObjectName } from "@/utils/s3-app-client";
import { AuthorModel, CollectionModel, SubmissionModel } from "@/models";

async function main() {
  const objects = await getS3AppClient().listObjects({ delimiter: "/" });
  const imageIdSet = new Set(
    objects.map(({ Key }) => Key!.slice(0, Key!.length - 4))
  );
  const collections = await CollectionModel.listAllCollection();

  for (const collection of collections) {
    const authors = await AuthorModel.findAuthorsByCollection(collection.id);
    const submissions = await SubmissionModel.findSubmissionsByCollection(
      collection.id
    );
    for (const author of authors) {
      imageIdSet.delete(author.imageId);
    }
    for (const submission of submissions) {
      imageIdSet.delete(submission.imageId);
    }
  }

  for (const imageId of Array.from(imageIdSet.values())) {
    const objectName = getObjectName(imageId);
    console.log(objectName);
    await getS3AppClient().deleteObject(objectName);
  }
}

main();
