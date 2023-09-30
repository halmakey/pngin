import { client } from "../request";

export interface DeleteAuthorSubmissionsRequest {
  collectionId: string;
  token: string;
}

export async function deleteAuthorSubmissions(
  body: DeleteAuthorSubmissionsRequest
) {
  const result = await client.delete<DeleteAuthorSubmissionsRequest, never>(
    "/api/author-submissions",
    body
  );
  return result;
}
