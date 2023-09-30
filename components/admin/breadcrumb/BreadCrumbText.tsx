import { ReactNode } from "react";

export default function BreadCrumbText({ children }: { children?: ReactNode }) {
  return <span className="text-xl font-bold">{children}</span>;
}
