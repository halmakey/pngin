import { ExportRequest, ExportResult } from "@/types/model";
import { client } from "../request";

export interface GetExportsResponse {
  exportRequests: ExportRequest[];
  exportResults: ExportResult[];
}

export async function getAdminExports(collectionId: string) {
  const result = await client.get<GetExportsResponse>(
    `/api/admin/collection/${collectionId}/export`
  );
  return result;
}
