#!/usr/bin/env -S npx tsx

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createTransactWrite } from "@/models/dynamodb";
import { migrate } from "@/models/MigrationModel";
import { CollectionModel } from "@/models";

async function main() {
  await migrate(
    "2023-07-02_2_collection_max_submissions_count_per_user",
    async () => {
      const tx = createTransactWrite();
      const collections = await CollectionModel.listAllCollection();
      for (const collection of collections) {
        collection.submissionsPerAuthor = 3;
        collection.timestamp = Date.now();
        tx.put(collection);
      }
      await tx.write();
    }
  );
}

main();
