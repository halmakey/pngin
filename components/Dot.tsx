import { ReactNode } from "react";

export type DotColor = "gray" | "orange" | "red" | "green" | "blue";

const colorMap: Record<DotColor, string> = {
  gray: "bg-slate-400",
  orange: "bg-orange-500",
  green: "bg-green-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
};

export function Dot({
  color = "gray",
  children,
}: {
  color?: DotColor;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <div
        className={`inline-block h-[8px] w-[8px] rounded-full ${colorMap[color]}`}
      />
      {children}
    </div>
  );
}
