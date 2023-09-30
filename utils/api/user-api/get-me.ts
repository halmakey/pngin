import { client } from "../request";
import { User } from "@/types/model";

export interface GetMeResponse {
  user: User;
}

export function getMe() {
  return client.get<GetMeResponse>("/api/user/@me");
}
