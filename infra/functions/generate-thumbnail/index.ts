import { S3EventRecord, S3Handler } from "aws-lambda";
import path from "path";
import { resizeThumbnail } from "./resize";
import { getObjectName } from "@/utils/s3-app-client";
import { createConcurrent } from "@/utils/concurrent";
import { getImageBucket, getThumbnailBucket } from "./bucket";
import os from "os";

const concurrent = createConcurrent(os.cpus().length);

export const handler: S3Handler = async (event, context) => {
  const imageBucket = getImageBucket();
  for (const { s3, eventName } of event.Records) {
    if (s3.bucket.name !== imageBucket.bucketName) {
      console.warn(
        "Unexpected bucket.name: " +
          s3.bucket.name +
          " vs " +
          imageBucket.bucketName
      );
      continue;
    }

    if (eventName.startsWith("ObjectCreated:")) {
      await handleCreate(s3);
    } else if (eventName.startsWith("ObjectRemoved:")) {
      await handleRemove(s3);
    }
  }
};

async function handleCreate({ object }: S3EventRecord["s3"]) {
  const imageBucket = getImageBucket();
  const thumbnailBucket = getThumbnailBucket();

  const imageId = path.basename(object.key, ".png");

  const objectName = getObjectName(imageId);
  const objectResult = await imageBucket.getObject(objectName);
  const inFile = await objectResult?.Body?.transformToByteArray();
  if (!inFile) {
    throw new Error("Unexpected body: " + objectName);
  }

  await Promise.all(
    (["original", 600, 400, 300, 200] as const).map(async (size) => {
      return concurrent.queue(async () => {
        const buffer = await resizeThumbnail(inFile, size);
        await thumbnailBucket.putObject(
          `${size}/${imageId}.jpg`,
          buffer,
          "image/jpeg"
        );
      });
    })
  );
  console.log("generate-thumbnail: " + imageId);
}

async function handleRemove({ object }: S3EventRecord["s3"]) {
  const thumbnailBucket = getThumbnailBucket();

  const imageId = path.basename(object.key, ".png");

  await Promise.all([
    thumbnailBucket.deleteObject(`original/${imageId}.jpg`),
    thumbnailBucket.deleteObject(`600/${imageId}.jpg`),
    thumbnailBucket.deleteObject(`400/${imageId}.jpg`),
    thumbnailBucket.deleteObject(`300/${imageId}.jpg`),
    thumbnailBucket.deleteObject(`200/${imageId}.jpg`),
  ]).catch(() => {});

  console.log("delete-thumbnail: " + imageId);
}
