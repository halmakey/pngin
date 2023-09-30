import { Reject } from "@/types/model";
import { client } from "../request";

export interface GetRejectResponse {
  reject: Reject | null;
}

export async function getAdminReject(authorId: string) {
  const result = await client.get<GetRejectResponse>(
    `/api/admin/author/${authorId}/reject`
  );
  return result;
}
