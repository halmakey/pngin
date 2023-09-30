import { useAsync } from "@/hooks/useAsync";
import useDisableScroll from "@/hooks/useDisableScroll";
import { getImageUrl, getThumbnailUrl } from "@/utils/url";
import { useMemo, useRef, useState } from "react";

export default function PreviewImage({
  imageId,
  maxSize,
  width,
  height,
}: {
  imageId: string;
  maxSize: number;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [hide, setHide] = useState(true);
  useAsync(async () => {
    if (!ref.current || !imageId) {
      return;
    }
    setHide(true);
    ref.current.src = getImageUrl(imageId);
    await ref.current.decode();
    setHide(false);
  }, [imageId]);

  const { scaledWidth, scaledHeight } = useMemo(() => {
    const adjust = width === height ? Math.sqrt(2) : 1;
    const scale = Math.min(maxSize / width, maxSize / height);
    return {
      scaledWidth: (width * scale) / adjust,
      scaledHeight: (height * scale) / adjust,
    };
  }, [height, maxSize, width]);

  const [thumbSrc, thumbSrcSet] = useMemo(() => {
    const src1x = getThumbnailUrl(imageId, 200);
    const src2x = getThumbnailUrl(imageId, 400);
    return [src1x, [src1x + " 1x", src2x + " 2x"].join(",")];
  }, [imageId]);

  useDisableScroll(!hide);

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
      style={{
        width: scaledWidth,
        height: scaledHeight,
      }}
    >
      <img
        className="absolute top-0 left-0"
        loading="lazy"
        decoding="sync"
        alt={imageId}
        src={thumbSrc}
        srcSet={thumbSrcSet}
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      />
      <img
        ref={ref}
        className="absolute top-0 left-0 z-10 transition"
        style={{
          width: scaledWidth,
          height: scaledHeight,
          opacity: hide ? 0 : 1,
        }}
        alt={imageId}
      />
    </div>
  );
}
