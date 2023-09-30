import { Collection } from "@/types/model";
import { client } from "../request";

export interface GetCollectionReponseBody {
  collection: Collection;
}

export async function getCollection(collectionId: string) {
  const result = await client.get<GetCollectionReponseBody>(
    `/api/collection/${collectionId}`
  );
  return result;
}
