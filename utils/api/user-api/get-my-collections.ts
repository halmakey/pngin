import { Collection } from "@/types/model";
import { client } from "../request";

export interface GetMyCollectionsResponse {
  collections: Collection[];
}

export async function getMyCollections() {
  const result = await client.get<GetMyCollectionsResponse>(
    `/api/user/@me/collection`
  );
  return result;
}
