import { client } from "../request";
import { CollectionPath } from "@/types/model";

export interface DeleteCollectionPathRequest {
  path: string;
}
export interface DeleteCollectionPathResponse {
  collectionPaths: CollectionPath[];
}

export async function deleteAdminCollectionPath(
  collectionId: string,
  body: DeleteCollectionPathRequest
) {
  const result = await client.delete<
    DeleteCollectionPathRequest,
    DeleteCollectionPathResponse
  >(`/api/admin/collection/${collectionId}/path`, body);
  return result;
}
