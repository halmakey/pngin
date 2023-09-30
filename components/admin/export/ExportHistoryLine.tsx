import { Dot, DotColor } from "@/components/Dot";
import ClockIcon from "@/components/assets/ClockIcon";
import ProgressCircle from "@/components/assets/ProgressCircle";
import { ExportStatus } from "@/utils/api/admin-api";
import { formatShortDateTime } from "@/utils/format-date-time";
import { useMemo } from "react";

const statusColor: Record<ExportStatus, DotColor> = {
  queue: "orange",
  timeout: "gray",
  progress: "green",
  error: "red",
  complete: "blue",
} as const;

const statusText: Record<ExportStatus, string> = {
  queue: "開始待ち",
  timeout: "タイムアウト",
  progress: "処理中",
  error: "エラー",
  complete: "完了",
} as const;

export function ExportHistoryLine({
  exportId,
  timestamp,
  message,
  exportStatus,
}: {
  exportId: string;
  timestamp: number;
  message?: string;
  exportStatus: ExportStatus;
}) {
  const dateTime = useMemo(() => formatShortDateTime(timestamp), [timestamp]);
  const busy = exportStatus === "queue" || exportStatus === "progress";
  return (
    <div className="flex items-center gap-2 fill-gray-800" title={message}>
      {busy ? <ProgressCircle height={16} /> : <ClockIcon height={16} />}
      <span className="font-mono text-lg">{dateTime}</span>
      <span className="border px-1 font-mono text-lg font-bold text-gray-500">
        {exportId}
      </span>
      <Dot color={statusColor[exportStatus]}>{statusText[exportStatus]}</Dot>
    </div>
  );
}
