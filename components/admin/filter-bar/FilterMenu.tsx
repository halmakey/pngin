import useBlockCallback from "@/hooks/useBlockCallback";
import { ReactNode, useRef } from "react";

export default function FilterMenu({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose(): void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useBlockCallback(ref, onClose);
  return (
    <div
      ref={ref}
      className="absolute right-2 top-2 z-10 flex flex-col items-stretch overflow-hidden rounded bg-gray-800 p-2"
    >
      {children}
    </div>
  );
}
