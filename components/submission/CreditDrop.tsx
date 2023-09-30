import { useImageProcessor } from "@/hooks/useImageProcessor";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import CreditSize from "./assets/CreditSize";
import { CrossIcon } from "./assets/CrossIcon";
import ResetIcon from "./assets/ResetIcon";
import { ACCEPT_IMAGE_FILE_TYPES, IMAGE_FILE_TYPES } from "./constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export interface CreditDropState {
  blob?: Blob;
  imageUrl?: string;
}

const SIZES = [{ width: 700, height: 400 }];

export default function CreditDrop({
  defaultImageUrl,
  onChange,
  disabled,
  warn,
}: {
  defaultImageUrl?: string;
  onChange: (state: CreditDropState) => void;
  disabled?: boolean;
  warn?: boolean;
}) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(defaultImageUrl);
  const creditRef = useRef<HTMLInputElement>(null);
  const [inputFile, setInputFile] = useState<File>();
  const { result } = useImageProcessor({
    sizes: SIZES,
    inputFile,
  });

  useEffect(() => {
    setImageUrl(defaultImageUrl);
    setInputFile(undefined);
  }, [defaultImageUrl]);

  useEffect(() => {
    if (result?.main) {
      setImageUrl(URL.createObjectURL(result?.main));
    }
  }, [result?.main]);

  useEffect(() => {
    onChange({
      blob: result?.main,
      imageUrl,
    });
  }, [onChange, imageUrl, result?.main]);

  const openFileSelection = useCallback(() => {
    if (disabled) {
      return;
    }
    creditRef.current?.click();
  }, [disabled]);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (disabled) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (disabled) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();

      const { files } = e.dataTransfer;
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        if (IMAGE_FILE_TYPES.indexOf(file.type) !== -1) {
          setInputFile(file);
          break;
        }
      }
    },
    [disabled]
  );

  const handleChangeImage = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }
      if (e.target.files?.length !== 1) {
        return;
      }
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      setInputFile(file);
    },
    [disabled]
  );

  const handleClearImage = useCallback(() => {
    if (disabled) {
      return;
    }
    setInputFile(undefined);
    setImageUrl(undefined);
  }, [disabled]);

  const handleResetImage = useCallback(() => {
    if (disabled) {
      return;
    }
    setInputFile(undefined);
    setImageUrl(defaultImageUrl);
  }, [defaultImageUrl, disabled]);

  return (
    <div
      className="relative h-[200px] w-[350px]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-500 text-center ${
          imageUrl ? "hidden" : ""
        }`}
      >
        <CreditSize />
        ここにクレジット画像をドロップ
        <br />
        または
        <button type="button" className="btn-fill" onClick={openFileSelection}>
          ファイルを選択
        </button>
      </div>
      {imageUrl ? (
        <>
          <img
            className="pointer-events-none absolute left-0 top-0 h-full w-full"
            width="350"
            height="200"
            src={imageUrl}
            alt="Credit"
          />
          {!!warn && defaultImageUrl && defaultImageUrl === imageUrl && (
            <>
              <div className="absolute top-0 left-0 right-0 bottom-0 flex border-8 border-red-500" />
              <div className="absolute top-0 left-0 flex h-[40px] w-[40px] items-center justify-center bg-red-500 text-white">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
            </>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={handleClearImage}
              className="btn-fill absolute right-0 top-0 h-[40px] w-[40px] !p-0"
            >
              <CrossIcon className="m-auto" />
            </button>
          )}
        </>
      ) : defaultImageUrl ? (
        <button
          type="button"
          onClick={handleResetImage}
          className="btn-fill absolute right-0 top-0 h-[40px] w-[40px] !p-0"
        >
          <ResetIcon className="m-auto" />
        </button>
      ) : null}
      <input
        ref={creditRef}
        className="right-0 hidden border border-gray-500 p-1"
        type="file"
        id="credit"
        name="credit"
        accept={ACCEPT_IMAGE_FILE_TYPES}
        onChange={handleChangeImage}
      />
    </div>
  );
}
