import { Submission, SubmissionID } from "@/types/model";
import { getImageUrl } from "@/utils/url";
import { DragEvent, useCallback, useEffect, useMemo, useState } from "react";
import SubmissionDrop, { SubmissionDropValue } from "./SubmissionDrop";

export interface SubmissionImageStateEmpty {
  key: number;
  submission: undefined;
  image: undefined;
  imageUrl?: string;
}
export interface SubmissionImageStateExists {
  key: number;
  submission: Submission;
  image: undefined;
  imageUrl?: string;
}

export interface SubmissionImageStateNew {
  key: number;
  submission: undefined;
  image: {
    blob: Blob;
    width: number;
    height: number;
  };
  imageUrl?: string;
}

export type SubmissionImageState =
  | SubmissionImageStateEmpty
  | SubmissionImageStateExists
  | SubmissionImageStateNew;

export interface SubmissionState {
  changed: boolean;
  images: SubmissionImageState[];
}

function statesFromSubmissions(
  submissions: Submission[]
): SubmissionImageState[] {
  const now = Date.now();
  return submissions.length > 0
    ? submissions.map((submission, i) => ({
        key: now + i,
        submission,
        image: undefined,
        imageUrl: getImageUrl(submission.imageId),
      }))
    : [{ key: now, submission: undefined, image: undefined }];
}

function isChanged(submissions: Submission[], images: SubmissionImageState[]) {
  return (
    submissions.length !== images.length ||
    submissions.reduce((p, c, i) => {
      return p || !!images[i]?.image || c.id !== images[i]?.submission?.id;
    }, false)
  );
}

export default function SubmissionDropList({
  defaultSubmissions,
  onStateChange,
  disabled,
  warnIds = [],
  maxSubmissions,
}: {
  defaultSubmissions: Submission[];
  onStateChange: (state: SubmissionState) => void;
  disabled?: boolean;
  warnIds?: string[];
  maxSubmissions: number;
}) {
  const [state, setState] = useState<SubmissionState>({
    changed: false,
    images: statesFromSubmissions(defaultSubmissions),
  });

  useEffect(() => {
    onStateChange(state);
  }, [onStateChange, state]);
  useEffect(() => {
    setState({
      changed: false,
      images: statesFromSubmissions(defaultSubmissions),
    });
  }, [defaultSubmissions]);

  const [draggingKey, setDraggingKey] = useState<number>();

  const handles = useMemo(
    () =>
      state.images.map((image, index) => ({
        handleCancel() {
          const images = state.images.filter((oldImage) => oldImage !== image);
          if (images.length === 0) {
            images.push({
              key: Date.now(),
              image: undefined,
              submission: undefined,
            });
          }
          setState((state) => ({
            ...state,
            images,
            changed: isChanged(defaultSubmissions, images),
          }));
        },
        handleImage(value: SubmissionDropValue | null) {
          if (!value) {
            return;
          }
          setState((state) => {
            const index = state.images.findIndex((s) => s.key === image.key);
            if (index === -1) {
              return { ...state };
            }
            const images = state.images.slice();
            const prevImage = images[index];
            images[index] = {
              key: prevImage.key,
              image: value,
              submission: undefined,
              imageUrl: URL.createObjectURL(value.blob),
            };
            return {
              ...state,
              images,
              changed: true,
            };
          });
        },
        handleDragStart() {
          setDraggingKey(image.key);
        },
        handleDragOver(e: DragEvent<HTMLElement>) {
          e.stopPropagation();
          e.preventDefault();
          if (!draggingKey || draggingKey === image.key) {
            return;
          }
          setState((prev) => {
            const draggingImage = state.images.find(
              (i) => i.key === draggingKey
            );
            if (!draggingImage) {
              return prev;
            }

            const up =
              prev.images.indexOf(draggingImage) < prev.images.indexOf(image);
            const images = prev.images.reduce<SubmissionImageState[]>(
              (p, c) => {
                if (c.key === image.key) {
                  return up
                    ? [...p, c, draggingImage]
                    : [...p, draggingImage, c];
                } else if (c.key === draggingKey) {
                  return p;
                } else {
                  return [...p, c];
                }
              },
              []
            );
            return {
              ...prev,
              images,
              changed: isChanged(defaultSubmissions, images),
            };
          });
        },
        handleDragEnd(e: DragEvent) {
          setDraggingKey(undefined);
        },
      })),
    [defaultSubmissions, draggingKey, state.images]
  );

  const handleAddSubmission = useCallback(() => {
    setState((state) => {
      const key = state.images.reduce((p, c) => Math.max(c.key + 1, p), 1);
      const images = [
        ...state.images,
        {
          key,
          image: undefined,
          submission: undefined,
        },
      ];
      return {
        ...state,
        images,
        initial: false,
      };
    });
  }, []);

  const handleDragOverFile = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();

      if (e.dataTransfer.types.includes("Files")) {
        handleAddSubmission();
      }
    },
    [handleAddSubmission]
  );

  return (
    <div className="flex flex-row flex-wrap gap-4">
      {state.images.map((imageState, i) => (
        <div
          key={imageState.key}
          draggable={!disabled}
          onDragStart={handles[i].handleDragStart}
          onDragOver={handles[i].handleDragOver}
          onDragEnd={handles[i].handleDragEnd}
          className={imageState.key === draggingKey ? "opacity-20" : ""}
        >
          <SubmissionDrop
            imageUrl={imageState.imageUrl}
            onClose={handles[i].handleCancel}
            onPrepared={handles[i].handleImage}
            canCloseEmpty={state.images.length > 1 || !!i}
            disabled={disabled}
            warn={
              !!imageState.submission &&
              warnIds.includes(imageState.submission.imageId)
            }
          />
        </div>
      ))}
      {!disabled && state.images.length < maxSubmissions && (
        <div
          className="h-[300px] w-[300px] bg-gray-100"
          onDragOver={handleDragOverFile}
        >
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-2 transition-opacity active:opacity-50"
            onClick={handleAddSubmission}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M36.9231 4.92308C36.9231 2.2 34.7231 0 32 0C29.2769 0 27.0769 2.2 27.0769 4.92308V27.0769H4.92308C2.2 27.0769 0 29.2769 0 32C0 34.7231 2.2 36.9231 4.92308 36.9231H27.0769V59.0769C27.0769 61.8 29.2769 64 32 64C34.7231 64 36.9231 61.8 36.9231 59.0769V36.9231H59.0769C61.8 36.9231 64 34.7231 64 32C64 29.2769 61.8 27.0769 59.0769 27.0769H36.9231V4.92308Z"
                fill="#1A274D"
              />
            </svg>
            クリックして作品を追加
          </button>
        </div>
      )}
    </div>
  );
}
