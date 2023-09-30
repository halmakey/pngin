#!/usr/bin/env -S npx tsx

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createTransactWrite } from "@/models/dynamodb";
import { CollectionModel } from "@/models";

async function main() {
  const allCollection = await CollectionModel.listAllCollection();

  const nextNumber = allCollection.length + 1;
  const collection = CollectionModel.createCollectionItem({
    name: `TEST COLLECTION ${nextNumber}`,
    sequence: nextNumber,
    url: "https://example.com",
    formActive: false,
    visible: false,
    submissionsPerAuthor: 3,
  });
  const transact = createTransactWrite();
  transact.put(collection, "noexists");
  await transact.write();

  console.log(JSON.stringify(collection, undefined, 2));
}

main();
