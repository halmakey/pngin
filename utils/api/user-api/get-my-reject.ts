import { Reject } from "@/types/model";
import { client } from "../request";

export interface GetMyRejectResponse {
  reject: Reject | null;
}

export async function getMyReject(collectionId: string) {
  const result = await client.get<GetMyRejectResponse>(
    `/api/user/@me/collection/${collectionId}/reject`
  );
  return result;
}
