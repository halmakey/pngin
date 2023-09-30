import { client } from "../request";
import { Author } from "@/types/model";

export interface GetAuthorResponse {
  author: Author;
}

export async function getAdminAuthor(authorId: string) {
  const result = await client.get<GetAuthorResponse>(
    `/api/admin/author/${authorId}`
  );
  return result;
}
