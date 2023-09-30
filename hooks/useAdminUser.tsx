import { AdminAPI } from "@/utils/api";
import useSWR from "swr";

export default function useAdminUser(userId?: string) {
  return useSWR(userId, (userId && AdminAPI.getAdminUser) || (() => undefined));
}
