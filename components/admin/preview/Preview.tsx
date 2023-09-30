import useResizeMemo from "@/hooks/useResizeMemo";
import { Author } from "@/types/model";
import { MouseEvent, useCallback, useEffect, useRef } from "react";
import PreviewFooter from "./PreviewFooter";
import PreviewImage from "./PreviewImage";
import LeftIcon from "@/components/assets/LeftIcon";
import RightIcon from "@/components/assets/RightIcon";
import Check from "@/components/assets/Check";

export interface PreviewProps {
  image?: {
    id: string;
    width: number;
    height: number;
  };
  author?: Author;
  selected?: boolean;
  onClose?(): void;
  onNext?(): void;
  onPrev?(): void;
  onCheck?(): void;
}

export default function Preview({
  image,
  author,
  selected,
  onClose,
  onNext,
  onPrev,
  onCheck,
}: PreviewProps) {
  const show = !!image;
  const { ref: viewRef, value: maxImageSize } = useResizeMemo<
    HTMLDivElement,
    number
  >((entry) => {
    if (!entry) {
      return 0;
    }
    return Math.min(entry.contentRect.width, entry.contentRect.height);
  }, []);

  const handlePrev = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onPrev?.();
    },
    [onPrev]
  );
  const handleNext = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onNext?.();
    },
    [onNext]
  );

  const handleCheck = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onCheck?.();
    },
    [onCheck]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) {
      return;
    }

    const keyToCallback = (e: KeyboardEvent) => {
      if (!show) {
        return;
      }
      switch (e.code) {
        case "KeyX":
          e.preventDefault();
          onCheck?.();
          break;
        case "Escape":
        case "Space":
          e.preventDefault();
          onClose?.();
          break;
        case "KeyJ":
        case "KeyL":
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          onNext?.();
          break;
        case "KeyK":
        case "KeyH":
        case "ArrowUp":
        case "ArrowLeft": {
          e.preventDefault();
          onPrev?.();
          break;
        }
        default:
          console.log(e.code);
          break;
      }
    };
    window.addEventListener("keydown", keyToCallback);
    return () => {
      window.removeEventListener("keydown", keyToCallback);
    };
  }, [onCheck, onClose, onNext, onPrev, show]);

  return (
    <div
      ref={containerRef}
      className="fixed left-0 top-0 z-20 flex h-screen w-screen flex-col items-stretch justify-center text-white backdrop-blur backdrop-grayscale transition"
      style={{
        opacity: show ? 1 : 0,
        backgroundColor: "#000c",
        pointerEvents: show ? "auto" : "none",
      }}
      onClick={onClose}
    >
      <div className="h-[20px] w-full justify-end"></div>
      <div className="flex flex-1 items-center">
        <button
          type="button"
          className="btn-opacity p-4"
          onClick={handlePrev}
          disabled={!onPrev}
        >
          <LeftIcon height={32} fill="white" />
        </button>
        <div ref={viewRef} className="relative flex-1 self-stretch">
          {image && (
            <>
              <PreviewImage
                key={image.id}
                maxSize={maxImageSize}
                imageId={image.id}
                width={image.width}
                height={image.height}
              />
              {selected !== undefined && (
                <button
                  id={image.id}
                  type="button"
                  className={`absolute right-0 h-[32px] w-[32px] fill-white hover:bg-cyan-500  active:bg-cyan-800 ${
                    selected ? "bg-cyan-500" : "bg-gray-400"
                  }`}
                  onClick={handleCheck}
                >
                  <Check height={24} className="m-auto" />
                </button>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          className="btn-opacity p-4"
          onClick={handleNext}
          disabled={!onNext}
        >
          <RightIcon height={32} fill="white" />
        </button>
      </div>
      <div className="flex w-full justify-center">
        <PreviewFooter key={author?.id} author={author} />
      </div>
    </div>
  );
}
