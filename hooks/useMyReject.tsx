import { Reject } from "@/types/model";
import { UserAPI } from "@/utils/api";
import useSWR from "swr";

export default function useMyReject(
  collectionId: string,
  fallback?: Reject | null,
  interval?: boolean
) {
  return useSWR(
    collectionId && `reject:${collectionId}`,
    () => UserAPI.getMyReject(collectionId),
    {
      refreshInterval: (interval && 1000 * 10) || undefined,
      fallbackData: { reject: fallback ?? null },
    }
  );
}
