import { client } from "../request";
import { ExportRequest } from "@/types/model";

export interface PostExportRequestResponse {
  exportRequest: ExportRequest;
}

export async function postAdminExportRequest(collectionId: string) {
  const result = await client.post<
    Record<never, never>,
    PostExportRequestResponse
  >(`/api/admin/collection/${collectionId}/export`, {});
  return result;
}
