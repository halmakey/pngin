#!/usr/bin/env -S npx tsx

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { TransactWrite, createTransactWrite } from "@/models/dynamodb";
import { getS3AppClient } from "@/utils/api-server/shared";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { getObjectName } from "@/utils/s3-app-client";
import {
  AuthorModel,
  CollectionModel,
  SubmissionModel,
  UserModel,
} from "@/models";
import { Author, Collection } from "@/types/model";
import { argv } from "process";

const SUBMISSION_SIZES = [
  { width: 1920, height: 1080 },
  { width: 1080, height: 1920 },
  { width: 1920, height: 1920 },
] as const;

async function generateImage(
  size: (typeof SUBMISSION_SIZES)[number] | { width: 700; height: 400 }
): Promise<{ id: string; size: typeof size }> {
  const id = nanoid();
  const res = await fetch(
    `https://picsum.photos/seed/${id}/${size.width}/${size.height}`
  );
  const buffer = await res.arrayBuffer();
  const pngBuffer = await sharp(buffer).png().toBuffer();
  const objectName = getObjectName(id);
  const exist = await getS3AppClient().headObject(objectName);
  if (exist) {
    throw new Error(`image ${id} already exists.`);
  }

  await getS3AppClient().putObject(objectName, pngBuffer, "image/png");

  return {
    id,
    size,
  };
}

async function generateAuthor(
  tx: TransactWrite,
  collection: Collection,
  index: number
) {
  const user = UserModel.createUserItem({
    name: `Test User ${index}`,
    avatarUrl: `https://picsum.photos/seed/test-user-${index}/300/300`,
    role: "user",
    discord: null,
  });
  user.id = `test-user-${index}`;
  user.pkey = UserModel.getPKey(user.id);
  tx.put(user);

  const image = await generateImage({ width: 700, height: 400 });
  const author = AuthorModel.createAuthorItem(collection.id, user.id, {
    name: `Test Author ${index}`,
    comment: "",
    imageId: image.id,
  });
  tx.put(author);

  return author;
}

async function generateSubmissions(tx: TransactWrite, author: Author) {
  const submissionImages = await Promise.all([
    generateImage({ width: 1920, height: 1080 }),
    generateImage({ width: 1920, height: 1920 }),
    generateImage({ width: 1080, height: 1920 }),
  ]);
  const submissions = submissionImages.map((image, sequence) =>
    SubmissionModel.createSubmissionItem({
      collectionId: author.collectionId,
      sequence,
      authorId: author.id,
      imageId: image.id,
      comment: "",
      height: image.size.height,
      width: image.size.width,
    })
  );
  for (const submission of submissions) {
    tx.put(submission);
  }
  return submissions;
}

async function main() {
  const args = argv.slice(2);
  const collectionId = args.shift();
  const size = Number(args.shift());
  const collection =
    collectionId && (await CollectionModel.getCollection(collectionId));
  if (!collectionId || !collection || !isFinite(size) || !size) {
    console.error("Run with valid collectionId");
    return;
  }

  const authors = await AuthorModel.findAuthorsByCollection(collectionId);
  const testAuthors = authors.filter((author) =>
    author.id.startsWith(collectionId + ".test-user-")
  );

  for (
    let index = testAuthors.length;
    index < testAuthors.length + size;
    index++
  ) {
    const tx = createTransactWrite();
    const author = await generateAuthor(tx, collection, index);
    await generateSubmissions(tx, author);
    await tx.write();
  }
}

main();
