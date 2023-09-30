import { Collection } from "@/types/model";
import { client } from "../request";

export interface GetCollectionsReponseBody {
  collections: Collection[];
}

export async function getCollections() {
  const result = await client.get<GetCollectionsReponseBody>(`/api/collection`);
  return result;
}
