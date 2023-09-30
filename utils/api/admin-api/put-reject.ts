import { client } from "../request";
import { Reject, RejectStatus } from "@/types/model";

export interface PutRejectRequest {
  imageIds: string[];
  message: string;
  status: RejectStatus;
}

export interface PutRejectResponse {
  reject: Reject;
}

export async function putAdminReject(authorId: string, body: PutRejectRequest) {
  const result = await client.put<PutRejectRequest, PutRejectResponse>(
    `/api/admin/author/${authorId}/reject`,
    body
  );
  return result;
}
