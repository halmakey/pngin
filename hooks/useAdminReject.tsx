import { AuthorID, Reject } from "@/types/model";
import { AdminAPI } from "@/utils/api";
import useSWR from "swr";

export default function useAdminReject(
  authorId: AuthorID,
  fallbackData: Reject | null,
  interval?: boolean
) {
  return useSWR(`reject:${authorId}`, () => AdminAPI.getAdminReject(authorId), {
    fallbackData: { reject: fallbackData },
    refreshInterval: (interval && 1000 * 10) || undefined,
  });
}
