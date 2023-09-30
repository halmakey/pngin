import { client } from "../request";

export async function deleteAdminReject(authorId: string) {
  const result = await client.delete<Record<never, never>, never>(
    `/api/admin/author/${authorId}/reject`,
    {}
  );
  return result;
}
