import useResizeMemo from "@/hooks/useResizeMemo";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DragEvent, MouseEvent, ReactNode, useEffect } from "react";

type SelectableColor = "cyan" | "red";

const selectableColorMap: Record<
  SelectableColor,
  { focusBorder: string; selectedBorder: string; selectedBg: string }
> = {
  cyan: {
    focusBorder: "border-purple-500",
    selectedBorder: "border-cyan-500",
    selectedBg: "bg-cyan-500",
  },
  red: {
    focusBorder: "border-purple-500",
    selectedBorder: "border-red-500",
    selectedBg: "bg-red-500",
  },
} as const;

export default function Selectable({
  id,
  children,
  focus,
  selected,
  draggable,
  scale,
  color = "cyan",
  onCheck,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  id: string;
  children: ReactNode;
  focus: boolean;
  selected: boolean;
  draggable?: boolean;
  scale?: boolean;
  color?: SelectableColor;
  onCheck?: (e: MouseEvent<HTMLButtonElement>) => void;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}) {
  const { ref: containerRef, value: selectedScale } = useResizeMemo<
    HTMLDivElement,
    number
  >((entry) => {
    if (!entry) {
      return 1;
    }
    const { width, height } = entry.contentRect;
    return Math.max((width - 32) / width, (height - 32) / height);
  }, []);

  const selectableColor = selectableColorMap[color];

  useEffect(() => {
    if (!focus || !containerRef.current) {
      return;
    }
    containerRef.current.focus();
    () => {
      containerRef.current?.blur();
    };
    if (
      "scrollIntoViewIfNeeded" in containerRef.current &&
      typeof containerRef.current.scrollIntoViewIfNeeded === "function"
    ) {
      containerRef.current.scrollIntoViewIfNeeded();
      return;
    }
    containerRef.current.scrollIntoView();
  }, [containerRef, focus]);

  return (
    <div
      id={id}
      ref={containerRef}
      className={
        "relative flex select-none flex-col items-center justify-center outline-none"
      }
      tabIndex={0}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        className="transition"
        style={{
          transform: `scale(${scale && selected ? selectedScale : 1})`,
        }}
      >
        {children}
      </div>
      <div
        className={`pointer-events-none absolute top-0 bottom-0 left-0 right-0 transition-all ${
          focus
            ? selectableColor.focusBorder
            : selected
            ? selectableColor.selectedBorder
            : ""
        }`}
        style={{
          borderWidth: focus ? 12 : selected ? 8 : 0,
        }}
      />
      <div
        className={`absolute top-0 right-0 bottom-0 left-0 transition-opacity hover:opacity-100 ${
          selected ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          id={id}
          type="button"
          className={`absolute right-0 top-0 h-[32px] w-[32px] justify-center text-white hover:bg-cyan-500 active:bg-cyan-800 ${
            selected ? selectableColor.selectedBg : "bg-gray-400"
          }`}
          onClick={onCheck}
        >
          <FontAwesomeIcon icon={faCheck} />
        </button>
      </div>
    </div>
  );
}
