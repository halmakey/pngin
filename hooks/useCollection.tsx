import useSWR from "swr";
import { Collection } from "@/types/model";
import { UserAPI } from "@/utils/api";

export default function useCollection(
  collectionId: string,
  fallback: Collection,
  interval?: boolean
) {
  return useSWR(collectionId, () => UserAPI.getCollection(collectionId), {
    refreshInterval: (interval && 1000 * 10) || undefined,
    fallbackData: {
      collection: fallback,
    },
  });
}
