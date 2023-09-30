import { useImageProcessor } from "@/hooks/useImageProcessor";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ProgressSquare from "../assets/ProgressSquare";
import { CrossIcon } from "./assets/CrossIcon";
import ImageSizes from "./assets/ImageSizes";
import { ACCEPT_IMAGE_FILE_TYPES, IMAGE_FILE_TYPES } from "./constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

const SIZES = [
  { width: 1920, height: 1920 },
  { width: 1920, height: 1080 },
  { width: 1080, height: 1920 },
];

export interface SubmissionDropValue {
  blob: Blob;
  width: number;
  height: number;
}

export default function SubmissionDrop({
  imageUrl,
  onClose,
  onPrepared,
  canCloseEmpty,
  disabled,
  warn,
}: {
  imageUrl?: string;
  onClose(): void;
  onPrepared(value: SubmissionDropValue | null): void;
  canCloseEmpty: boolean;
  disabled?: boolean;
  warn?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFile, setInputFile] = useState<File>();
  const { result, pending } = useImageProcessor({
    sizes: SIZES,
    inputFile,
  });

  useEffect(() => {
    if (!onPrepared) {
      return;
    }
    if (pending) {
      return;
    }
    if (!result?.main || !result?.targetSize) {
      onPrepared(null);
      return;
    }
    onPrepared({
      blob: result.main,
      width: result.targetSize.width,
      height: result.targetSize.height,
    });
    // Reason: Do not call the onChange() when it is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.main, result?.targetSize, pending]);

  const openFileSelection = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const { files } = e.dataTransfer;
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (IMAGE_FILE_TYPES.includes(file.type)) {
        setInputFile(file);
        return;
      }
    }
  }, []);

  const handleChangeImage = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length !== 1) {
      return;
    }
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    setInputFile(file);
  }, []);

  return (
    <div
      className="relative h-[300px] w-[300px] bg-repeat"
      style={
        imageUrl || pending
          ? { backgroundImage: "url('/assets/transparent-bg.svg')" }
          : { backgroundColor: "white" }
      }
      // onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {!disabled && !pending && !imageUrl && (
        <div
          className={`flex h-full w-full flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-500 text-center`}
        >
          <ImageSizes />
          ここに作品画像をドロップ
          <br />
          または
          <br />
          <button
            type="button"
            className="btn-fill"
            onClick={openFileSelection}
          >
            ファイルを選択
          </button>
        </div>
      )}
      {pending && (
        <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center">
          <ProgressSquare />
        </div>
      )}
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        id="credit"
        name="credit"
        accept={ACCEPT_IMAGE_FILE_TYPES}
        onChange={handleChangeImage}
        disabled={disabled}
      />
      {imageUrl && !pending && (
        <img
          className="pointer-events-none absolute left-0 top-0 h-full w-full object-contain"
          width="1920"
          height="1920"
          src={imageUrl}
          alt="Image"
        />
      )}
      {!!warn && (
        <>
          <div className="absolute top-0 left-0 right-0 bottom-0 flex border-8 border-red-500" />
          <div className="absolute top-0 left-0 flex h-[40px] w-[40px] items-center justify-center bg-red-500 text-white">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
        </>
      )}
      {!disabled && (canCloseEmpty || imageUrl) ? (
        <button
          type="button"
          onClick={onClose}
          className="btn-fill absolute right-0 top-0 h-[40px] w-[40px] !p-0"
        >
          <CrossIcon className="m-auto" />
        </button>
      ) : null}
    </div>
  );
}
