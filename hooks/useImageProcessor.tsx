import { useMemo } from "react";
import { useAsyncMemo } from "./useAsyncMemo";

type Size = { width: number; height: number };

export function useImageProcessor({
  sizes,
  expectSize,
  inputFile,
}: {
  sizes: Size[];
  expectSize?: Size;
  inputFile?: File;
}) {
  const { pending, result, error } = useAsyncMemo(async () => {
    if (!inputFile) {
      return;
    }

    const image = document.createElement("img");
    image.src = URL.createObjectURL(inputFile);
    await image.decode();

    let targetSize: Size;
    if (
      expectSize &&
      sizes.find(
        ({ width, height }) =>
          width === expectSize.width && height === expectSize.height
      )
    ) {
      targetSize = expectSize;
    } else {
      // Pick the closest aspect ratio
      const { width: inputWidth, height: inputHeight } = image;
      const inputRatio = inputWidth / inputHeight;
      targetSize = sizes.slice(1).reduce((prev, { width, height }) => {
        const prevDist = Math.abs(prev.width / prev.height - inputRatio);
        const currDist = Math.abs(width / height - inputRatio);
        return currDist < prevDist ? { width, height } : prev;
      }, sizes[0]);
    }

    const { width, height } = targetSize;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unexpected context");
    }

    canvas.width = width;
    canvas.height = height;

    // const minScale = Math.min(width / image.width, height / image.height);
    // const minWidth = image.width * minScale;
    // const minHeight = image.height * minScale;
    // const minLeft = (width - minWidth) * 0.5;
    // const minTop = (height - minHeight) * 0.5;

    const maxScale = Math.max(width / image.width, height / image.height);
    const maxWidth = image.width * maxScale;
    const maxHeight = image.height * maxScale;
    const maxLeft = (width - maxWidth) * 0.5;
    const maxTop = (height - maxHeight) * 0.5;

    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, maxLeft, maxTop, maxWidth, maxHeight);

    URL.revokeObjectURL(image.src);
    const main = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!main) {
      throw new Error("Unexpected blob");
    }
    return { main, targetSize };
  }, [expectSize, inputFile, sizes]);

  return useMemo(() => {
    return {
      error,
      pending,
      result,
    };
  }, [error, pending, result]);
}
