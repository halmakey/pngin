import { KeyboardEventHandler, ReactNode } from "react";

export default function PathBar({
  children,
  onKeyDown,
}: {
  children?: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      className="sticky top-4 z-10 flex min-h-[64px] w-full flex-wrap items-center rounded bg-gray-800/80 fill-white text-white backdrop-blur"
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
