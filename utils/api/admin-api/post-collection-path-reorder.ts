import { client } from "../request";
import { CollectionPath } from "@/types/model";

export interface PostCollectionPathReorderRequest {
  fromPath: string;
  toPath: string;
}
export interface PostCollectionPathReorderResponse {
  collectionPaths: CollectionPath[];
}

export async function postAdminCollectionPathReorder(
  collectionId: string,
  body: PostCollectionPathReorderRequest
) {
  const result = await client.post<
    PostCollectionPathReorderRequest,
    PostCollectionPathReorderResponse
  >(`/api/admin/collection/${collectionId}/path/reorder`, body);
  return result;
}
