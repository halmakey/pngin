import { format } from "date-fns";
import ja from "date-fns/locale/ja";

export function formatShortDateTime(timestamp: number) {
  return format(new Date(timestamp), "yyyy/MM/dd HH:mm:ss", {
    locale: ja,
  });
}
