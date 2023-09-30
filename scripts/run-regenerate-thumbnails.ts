#!/usr/bin/env -S npx tsx

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { AuthorModel, SubmissionModel } from "@/models";
import { Context, S3CreateEvent } from "aws-lambda";
import * as generateThumbnail from "@/infra/functions/generate-thumbnail";

(async () => {
  const authors = await AuthorModel.listAllAuthors();
  const submissions = await SubmissionModel.listAllSubmissions();

  const imageIds = [
    ...authors.map((a) => a.imageId),
    ...submissions.map((s) => s.imageId),
  ];
  for (const imageId of imageIds) {
    const event: S3CreateEvent = {
      Records: [
        {
          eventName: "ObjectCreated:Put",
          s3: {
            bucket: {
              name: process.env.PNGIN_IMAGE_BUCKET_NAME!,
            },
            object: {
              key: imageId + ".png",
            },
          },
        },
      ],
    } as S3CreateEvent;

    await Promise.all([
      generateThumbnail.handler(event, {} as Context, () => {}),
    ]);
  }
})();
