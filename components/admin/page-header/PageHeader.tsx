import { ReactNode } from "react";

export default function PageHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-2 p-4 text-xl">{children}</div>
  );
}
