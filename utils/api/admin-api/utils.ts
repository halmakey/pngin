import { ExportRequest, ExportResult } from "@/types/model";

export type ExportStatus =
  | "queue"
  | "error"
  | "complete"
  | "progress"
  | "timeout";

export function getExportStatus(
  req: ExportRequest,
  res?: ExportResult
): ExportStatus {
  const end = res?.status === "complete" || res?.status === "error";
  if (!end && Date.now() - (res?.startTime ?? req.timestamp) > 900000) {
    return "timeout";
  }
  if (!res) {
    return "queue";
  }
  if (res.status === "error") {
    return "error";
  }
  if (res.status === "complete") {
    return "complete";
  }
  return "progress";
}

export function getExportPublicUrls(
  res: ExportResult
): { path: string; json: string; video: string }[] {
  return res.paths.map((path) => {
    const urlPrefix = [
      process.env.NEXT_PUBLIC_EXPORT_ORIGIN,
      "collection",
      res.collectionId,
      path,
    ].join("/");
    return {
      path,
      json: [urlPrefix, "latest.json"].join("/"),
      video: [urlPrefix, "latest.mp4"].join("/"),
    };
  });
}
