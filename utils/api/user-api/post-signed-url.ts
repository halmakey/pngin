import type { PresignedPost } from "@aws-sdk/s3-presigned-post";

export async function postSignedUrl(post: PresignedPost, blob: Blob) {
  const body = Object.keys(post.fields).reduce((p, c) => {
    p.append(c, post.fields[c]);
    return p;
  }, new FormData());
  body.append("file", blob);
  const res = await fetch(post.url, {
    method: "POST",
    body,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}
