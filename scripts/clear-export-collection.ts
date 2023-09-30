#!/usr/bin/env -S npx tsx

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  CollectionModel,
  ExportRequestModel,
  ExportResultModel,
} from "@/models";
import { argv } from "process";
import { createTransactWrite } from "@/models/dynamodb";
import { createS3AppClient } from "@/utils/s3-app-client";

(async () => {
  const exportBucket = createS3AppClient({
    region: process.env.PNGIN_AWS_REGION!,
    accessKeyId: process.env.PNGIN_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.PNGIN_AWS_SECRET_ACCESS_KEY!,
    bucketName: process.env.PNGIN_EXPORT_BUCKET_NAME!,
  });

  const collectionId = argv.slice(2).shift();
  const collection =
    collectionId && (await CollectionModel.getCollection(collectionId));
  if (!collectionId || !collection) {
    console.error("Run with valid collectionId");
    return;
  }

  const requests = await ExportRequestModel.findExportRequestsByCollection(
    collectionId
  );
  const results = await ExportResultModel.findExportResultsByCollection(
    collectionId
  );

  const tx = createTransactWrite();
  for (const req of requests) {
    tx.delete(req.pkey);
  }
  for (const res of results) {
    tx.delete(res.pkey);
  }
  await tx.write();

  const result = await exportBucket.listObjects({
    prefix: `collection/${collectionId}`,
  });
  await Promise.all(result.map(({ Key }) => exportBucket.deleteObject(Key!)));
})();
