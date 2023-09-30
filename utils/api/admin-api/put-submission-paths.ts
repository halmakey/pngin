import { client } from "../request";
import { CollectionPath, SubmissionID } from "@/types/model";

export interface PutSubmissionPathsRequest {
  path: string;
  submissionIds: SubmissionID[];
}
export interface PutSubmissionPathsResponse {
  collectionPaths: CollectionPath[];
}

export async function putAdminSubmissionPaths(
  collectionId: string,
  body: PutSubmissionPathsRequest
) {
  const result = await client.put<
    PutSubmissionPathsRequest,
    PutSubmissionPathsResponse
  >(`/api/admin/collection/${collectionId}/submission/paths`, body);
  return result;
}
