import { User } from "@/types/model";
import { client } from "../request";

export interface GetUserResponse {
  user: User;
}

export function getAdminUser(userId: string) {
  return client.get<GetUserResponse>(`/api/admin/user/${userId}`);
}
