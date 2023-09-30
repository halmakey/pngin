import useSWR from "swr";
import { useContext } from "react";
import AuthContext from "@/contexts/auth-context";
import { UserAPI } from "@/utils/api";

export default function useMyCollections() {
  const { user } = useContext(AuthContext);
  return useSWR(
    user && `/user/${user.id}/collection`,
    UserAPI.getMyCollections
  );
}
