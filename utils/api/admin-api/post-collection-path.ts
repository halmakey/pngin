import { client } from "../request";
import { CollectionPath } from "@/types/model";

export interface PostCollectionPathRequest {
  path: string;
}
export interface PostCollectionPathResponse {
  collectionPath: CollectionPath;
}

export async function postAdminCollectionPath(
  collectionId: string,
  body: PostCollectionPathRequest
) {
  const result = await client.post<
    PostCollectionPathRequest,
    PostCollectionPathResponse
  >(`/api/admin/collection/${collectionId}/path`, body);
  return result;
}
