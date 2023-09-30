import sharp from "sharp";

export async function resizeThumbnail(
  inFile: Uint8Array,
  size: "original" | 600 | 400 | 300 | 200
) {
  const image = sharp(inFile);
  if (size !== "original") {
    image.resize({
      width: size,
      height: size,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  return await image.jpeg({ mozjpeg: true, quality: 95 }).toBuffer();
}
