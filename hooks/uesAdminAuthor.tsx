import useSWR from "swr";
import { Author } from "@/types/model";
import { AdminAPI } from "@/utils/api";

export default function useAdminAuthor(
  authorId: string,
  fallback: Author,
  interval?: boolean
) {
  return useSWR(
    authorId && `author:${authorId}`,
    () => AdminAPI.getAdminAuthor(authorId),
    {
      fallbackData: { author: fallback },
      refreshInterval: (interval && 1000 * 10) || undefined,
    }
  );
}
