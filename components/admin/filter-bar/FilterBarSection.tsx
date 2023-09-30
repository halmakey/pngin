import { ReactNode } from "react";

export default function FilterBarSection({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${className} flex items-center gap-2 px-2`}>
      {children}
    </div>
  );
}
