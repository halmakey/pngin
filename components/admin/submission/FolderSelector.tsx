import React, { useCallback, useEffect, useRef, useState } from "react";
import CaretRight from "@/components/assets/CaretRight";
import FolderIcon from "@/components/assets/FolderIcon";

export interface FolderSelectorProps {
  index: number;
  value: string;
  onOpen(index: number): string[];
  onSelect(index: number, folder: string): void;
}

export function FolderSelector(props: FolderSelectorProps) {
  const { index, value, onOpen, onSelect } = props;
  const parentRef = useRef<HTMLDivElement>(null);
  const [selections, setSelections] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    const result = onOpen(index);
    if (result.length) {
      setSelections(result);
      setOpen(true);
    }
    return;
  }, [index, onOpen]);

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const i = Number(e.currentTarget.id);
      onSelect(index, selections[i]);
      setOpen(false);
    },
    [index, onSelect, selections]
  );

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (parentRef.current?.contains(e.target as Node)) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("mousedown", close);
    };
  }, []);

  return (
    <div
      ref={parentRef}
      role="listbox"
      className={
        "h-[40px] min-w-[32px] overflow-visible whitespace-nowrap hover:bg-white/20 active:bg-white/10"
      }
    >
      <div
        className="absolute z-10 min-w-[32px] overflow-hidden border border-white bg-gray-800/90 transition-all"
        style={{
          opacity: open ? 1 : 0,
          height: open ? "" : 40,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {selections.map((f, i) => (
          <div
            role="option"
            aria-selected={f === value}
            className="relative flex h-[40px] min-w-[32px] items-center overflow-hidden text-ellipsis p-2 hover:bg-white/20 active:bg-white/10"
            key={i}
            id={i.toString()}
            onClick={handleSelect}
          >
            {f}
            {f === value && (
              <CaretRight className="ml-2 inline" height={12} fill="white" />
            )}
          </div>
        ))}
      </div>
      {value ? (
        <div
          className="relative flex h-full w-full cursor-pointer items-center overflow-hidden text-ellipsis border border-transparent p-2 transition hover:border-white"
          style={{
            opacity: open ? 0 : 1,
            pointerEvents: open ? "none" : "auto",
          }}
          onClick={handleOpen}
        >
          {value}
          <CaretRight className="ml-2 inline" height={12} fill="white" />
        </div>
      ) : (
        <div
          className={`relative flex h-full w-full cursor-pointer items-center overflow-hidden text-ellipsis border border-transparent p-2 transition hover:border-white`}
          style={{
            opacity: open ? 0 : 1,
            pointerEvents: open ? "none" : "auto",
          }}
          onClick={handleOpen}
        >
          <FolderIcon className="mr-2 inline" height={12} fill="white" />
        </div>
      )}
    </div>
  );
}
