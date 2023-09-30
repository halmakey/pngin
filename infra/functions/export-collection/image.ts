import { access, constants, readFile, writeFile } from "fs/promises";
import { mkdirp } from "mkdirp";
import path from "path";
import sharp from "sharp";
import os from "os";
import { getCacheBucket, getImageBucket } from "./bucket";

const concurrency = os.cpus().length * 2;

export async function createTile({
  inputs,
  totalWidth,
  tileWidth,
  totalHeight,
  tileHeight,
  output,
}: {
  inputs: string[];
  totalWidth: number;
  tileWidth: number;
  totalHeight: number;
  tileHeight: number;
  output: string;
}) {
  const repeat = Math.floor(totalWidth / tileWidth);
  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 3,
      background: "black",
    },
  })
    .composite(
      inputs.map((input, i) => {
        return {
          input,
          top: totalWidth - (Math.floor(i / repeat) + 1) * tileHeight,
          left: (i % repeat) * tileWidth,
        };
      })
    )
    .tiff({ compression: "deflate" })
    .toFile(output);
}

export async function prepareImages(
  root: string,
  imageIds: string[],
  width: number,
  height: number
) {
  let outputs: string[] = [];
  for (let index = 0; index < imageIds.length; index += concurrency) {
    const chunk = imageIds.slice(index, index + concurrency);
    const results = await Promise.all(
      chunk.map((iid) => prepareImage(root, iid, width, height))
    );
    outputs = [...outputs, ...results];
  }
  return outputs;
}

export async function prepareImage(
  root: string,
  imageId: string,
  width: number,
  height: number
) {
  const imageBucket = getImageBucket();
  const cacheBucket = getCacheBucket();
  const sourceKey = `${imageId}.png`;
  const outputFile = `${imageId}.tiff`;
  const outputPath = path.join(
    root,
    "images",
    `${width}x${height}`,
    outputFile
  );
  const cacheKey = `images/${width}x${height}/${outputFile}`;

  try {
    await access(outputPath, constants.R_OK);
    return outputPath;
  } catch {
    mkdirp(path.dirname(outputPath));

    const cache = await cacheBucket.getObject(cacheKey);
    if (cache?.Body) {
      await writeFile(outputPath, await cache.Body.transformToByteArray());
      return outputPath;
    }

    const output = await imageBucket.getObject(sourceKey);
    if (!output?.Body) {
      throw new Error("Object not found: " + sourceKey);
    }
    const buffer = await output.Body.transformToByteArray();
    await sharp(buffer)
      .removeAlpha()
      .resize({ width, height, fit: "fill" })
      .tiff({ compression: "deflate" })
      .toFile(outputPath);

    const outBuffer = await readFile(outputPath);
    await cacheBucket.putObject(cacheKey, outBuffer, "image/tiff");

    return outputPath;
  }
}
