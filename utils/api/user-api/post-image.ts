import { client } from "../request";
import { PresignedPost } from "@aws-sdk/s3-presigned-post";

export interface PostImagesRequest {
  token: string;
  count: number;
}
export interface PostImagesResponse {
  images: {
    id: string;
    post: PresignedPost;
  }[];
}

export async function postImages(body: PostImagesRequest) {
  const result = await client.post<PostImagesRequest, PostImagesResponse>(
    "/api/images",
    body
  );
  return result;
}
