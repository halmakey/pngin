import { client } from "../request";
import { CollectionPath, SubmissionID } from "@/types/model";

export interface PostSubmissionReorderRequest {
  path: string;
  primary: SubmissionID;
  fromSubmissions: SubmissionID[];
  toSubmission: SubmissionID;
}
export interface PostSubmissionReorderResponse {
  collectionPath: CollectionPath;
}

export async function postAdminSubmissionReorder(
  collectionId: string,
  body: PostSubmissionReorderRequest
) {
  const result = await client.post<
    PostSubmissionReorderRequest,
    PostSubmissionReorderResponse
  >(`/api/admin/collection/${collectionId}/submission/reorder`, body);
  return result;
}
