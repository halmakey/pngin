import useBlockCallback from "@/hooks/useBlockCallback";
import { FormEvent, useCallback, useEffect, useRef } from "react";

export default function FolderInput({
  index,
  defaultValue = "",
  color = "normal",
  onSubmit,
  onCancel,
}: {
  index: number;
  defaultValue?: string;
  color?: "normal" | "invert";
  onSubmit(index: number, text: string): void;
  onCancel(index: number): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const safeValue = inputRef.current?.value
        .replaceAll("/", "_")
        .replaceAll("\\", "_")
        .replaceAll("\n", "_")
        .replaceAll('"', "_")
        .replaceAll("'", "_")
        .replaceAll(".", "_")
        .replaceAll("*", "_");
      if (!inputRef.current || !safeValue) {
        onCancel(index);
        return;
      }
      onSubmit(index, safeValue);
    },
    [index, onCancel, onSubmit]
  );

  const handleCancel = useCallback(() => {
    onCancel(index);
  }, [index, onCancel]);

  const handleModalClick = useCallback(() => {
    onCancel(index);
  }, [index, onCancel]);

  useBlockCallback(inputRef, handleModalClick);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit} onReset={handleCancel}>
      <input
        type="text"
        ref={inputRef}
        className={`h-[40px] w-[184px] border ${
          color === "normal" ? "border-gray-800" : "border-white"
        } bg-transparent p-2 outline-none`}
        maxLength={256}
        onBlur={handleCancel}
        defaultValue={defaultValue}
        placeholder="フォルダ名を入力"
      />
    </form>
  );
}
