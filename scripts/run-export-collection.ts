#!/usr/bin/env -S npx tsx

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { CollectionModel, ExportRequestModel } from "@/models";
import { argv } from "process";
import { createTransactWrite } from "@/models/dynamodb";
import { Context, SQSEvent } from "aws-lambda";
import { handler } from "@/infra/functions/export-collection";

(async () => {
  const collectionId = argv.slice(2).shift();
  const collection =
    collectionId && (await CollectionModel.getCollection(collectionId));
  if (!collectionId || !collection) {
    console.error("Run with valid collectionId");
    return;
  }

  const request = ExportRequestModel.createExportRequest({
    collectionId,
  });
  await createTransactWrite().put(request).write();

  const event = {
    Records: [
      {
        attributes: {
          ApproximateReceiveCount: "1",
        },
        body: request.id,
      },
    ],
  } as SQSEvent;

  await handler(event, {} as Context, () => {});
})();
