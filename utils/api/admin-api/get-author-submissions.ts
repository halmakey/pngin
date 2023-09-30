import { client } from "../request";
import { Submission } from "@/types/model";

export interface GetAuthorSubmissionsRepsonseBody {
  submissions: Submission[];
}

export async function getAdminAuthorSubmissions(authorId: string) {
  const result = await client.get<GetAuthorSubmissionsRepsonseBody>(
    `/api/admin/author/${authorId}/submission`
  );
  return result;
}
