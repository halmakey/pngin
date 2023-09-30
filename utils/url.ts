export function getImageUrl(id: string) {
  return new URL(id + ".png", process.env.NEXT_PUBLIC_IMAGE_ORIGIN).toString();
}

export type ThumbnailSize = 200 | 300 | 400 | 600 | "original";

export function getThumbnailPath(id: string, size: ThumbnailSize) {
  return `/${size}/${id}.jpg`;
}

export function getThumbnailUrl(id: string, size: ThumbnailSize) {
  return new URL(
    `/${size}/${id}.jpg`,
    process.env.NEXT_PUBLIC_THUMBNAIL_ORIGIN
  ).toString();
}
