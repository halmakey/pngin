import { client } from "../request";
import { Collection } from "@/types/model";

export interface PutCollectionRequest {
  name: string;
  sequence: number;
  url: string;
  formActive: boolean;
  visible: boolean;
  submissionsPerAuthor: number;
}

export interface PutCollectionResponse {
  collection: Collection;
}

export async function putAdminCollection(
  collectionId: string,
  body: PutCollectionRequest
) {
  const result = await client.put<PutCollectionRequest, PutCollectionResponse>(
    `/api/admin/collection/${collectionId}`,
    body
  );
  return result;
}
