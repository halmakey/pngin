import { ReactNode } from "react";
export default function Main({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`container relative mx-auto flex flex-1 flex-col p-4 px-8 text-gray-800 ${className}`}
    >
      {children}
    </main>
  );
}
