import { Reject } from "@/types/model";
import { client } from "../request";

export interface GetCollectionRejectsResponse {
  rejects: Reject[];
}

export async function getAdminCollectionRejects(collectionId: string) {
  const result = await client.get<GetCollectionRejectsResponse>(
    `/api/admin/collection/${collectionId}/reject`
  );
  return result;
}
