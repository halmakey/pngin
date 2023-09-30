import { S3AppClient, createS3AppClient } from "@/utils/s3-app-client";

let imageBucket: S3AppClient;
export function getImageBucket() {
  if (imageBucket) {
    return imageBucket;
  }
  imageBucket = createS3AppClient({
    bucketName: process.env.PNGIN_IMAGE_BUCKET_NAME!,
  });
  return imageBucket;
}

let thumbnailBucket: S3AppClient;
export function getThumbnailBucket() {
  if (thumbnailBucket) {
    return thumbnailBucket;
  }
  thumbnailBucket = createS3AppClient({
    bucketName: process.env.PNGIN_THUMBNAIL_BUCKET_NAME!,
  });
  return thumbnailBucket;
}
