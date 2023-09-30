import useSWR from "swr";
import { Submission } from "@/types/model";
import { AdminAPI } from "@/utils/api";

export default function useAdminAuthorSubmissions(
  authorId?: string,
  fallback?: Submission[],
  interval?: boolean
) {
  return useSWR(
    authorId && `submissions:${authorId}`,
    () => AdminAPI.getAdminAuthorSubmissions(authorId ?? ""),
    {
      fallbackData: { submissions: fallback ?? [] },
      refreshInterval: (interval && 1000 * 10) || undefined,
    }
  );
}
