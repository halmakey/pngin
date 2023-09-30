import { client } from "../request";
import { Author, Submission } from "@/types/model";

export interface PutAuthorSubmissionsRequest {
  token: string;
  collectionId: string;
  author: {
    name: string;
    comment: string;
    imageId: string;
  };
  submissions: {
    imageId: string;
    comment: string;
    width: number;
    height: number;
  }[];
}

export interface PutAuthorSubmissionsResponse {
  author: Author;
  submissions: Submission[];
}

export async function putAuthorSubmissions(body: PutAuthorSubmissionsRequest) {
  const result = await client.put<
    PutAuthorSubmissionsRequest,
    PutAuthorSubmissionsResponse
  >("/api/author-submissions", body);
  return result;
}
