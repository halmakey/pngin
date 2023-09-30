import { ReactNode } from "react";

export default function PageHeaderHint({ children }: { children?: ReactNode }) {
  return (
    <div className="ml-auto flex gap-2 text-base font-bold text-gray-600">
      {children}
    </div>
  );
}
