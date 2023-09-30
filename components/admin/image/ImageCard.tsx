import { useAsyncCallback } from "@/hooks/useAsyncCallback";
import { ThumbnailSize, getThumbnailUrl } from "@/utils/url";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ProgressSquare from "@/components/assets/ProgressSquare";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

export default function ImageCard({
  imageId,
  thumbnailSize,
  width,
  height,
  hint,
}: {
  imageId: string;
  thumbnailSize: 200 | 300 | "original";
  width: number;
  height: number;
  hint?: "alert" | "info";
}) {
  // const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, srcSet] = useMemo(() => {
    const src1x = getThumbnailUrl(imageId, thumbnailSize);
    const src2x = getThumbnailUrl(
      imageId,
      typeof thumbnailSize === "number"
        ? ((thumbnailSize * 2) as ThumbnailSize)
        : thumbnailSize
    );
    return [src1x, [src1x + " 1x", src2x + " 2x"].join(",")];
  }, [imageId, thumbnailSize]);

  const { call: handleError, pending } = useAsyncCallback(
    async (e: SyntheticEvent<HTMLImageElement>) => {
      if (!imgRef.current) {
        return;
      }
      const img = imgRef.current;
      await new Promise((res) => setTimeout(res, 3000));
      const url = new URL(img.src);
      url.search = "t=" + Date.now();
      img.src = url.toString();
    },
    []
  );
  useEffect(() => {
    if (pending) {
      setLoading(true);
    }
  }, [pending]);
  const handleStartLoad = useCallback(() => {
    setLoading(true);
  }, []);
  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <div
      className={"flex flex-col items-center justify-center"}
      style={{
        background: "url('/assets/transparent-bg.svg')",
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <img
        ref={imgRef}
        className="object-contain"
        style={{
          visibility: loading ? "hidden" : "visible",
          maxWidth: `${width}px`,
          maxHeight: `${height}px`,
        }}
        src={src}
        srcSet={srcSet}
        alt="Click to view details"
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleStartLoad}
        loading="lazy"
        draggable={false}
      />
      {hint === "alert" && (
        <>
          <div className="absolute left-0 top-0 right-0 bottom-0 border-8 border-red-500" />
          <div className="absolute top-0 left-0 flex h-[40px] w-[40px] items-center justify-center bg-red-500 text-white">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
        </>
      )}
      {hint === "info" && (
        <>
          <div className="absolute left-0 top-0 right-0 bottom-0 border-8 border-green-500" />
          <div className="absolute top-0 left-0 flex h-[40px] w-[40px] items-center justify-center bg-green-500 text-white">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>
        </>
      )}
      {loading && <ProgressSquare className="absolute" />}
    </div>
  );
}

export function EmptyImageCard({
  count,
  width,
}: {
  count: number;
  width: number;
}) {
  return (
    <>
      {Array(count)
        .fill(undefined)
        .map((_, i) => (
          <div
            key={i}
            style={{
              width: `${width}px`,
            }}
          />
        ))}
    </>
  );
}
