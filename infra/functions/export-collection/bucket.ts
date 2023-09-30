import { S3AppClient, createS3AppClient } from "@/utils/s3-app-client";

let exportBucket: S3AppClient;
export function getExportBucket() {
  if (exportBucket) {
    return exportBucket;
  }
  exportBucket = createS3AppClient({
    bucketName: process.env.PNGIN_EXPORT_BUCKET_NAME!,
  });
  return exportBucket;
}

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

let cacheBucket: S3AppClient;
export function getCacheBucket() {
  if (cacheBucket) {
    return cacheBucket;
  }
  cacheBucket = createS3AppClient({
    bucketName: process.env.PNGIN_CACHE_BUCKET_NAME!,
  });
  return cacheBucket;
}
