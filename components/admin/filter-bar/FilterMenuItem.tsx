import { ReactNode } from "react";

export default function FilterMenuItem({
  children,
  onClick,
  disabled,
}: {
  children?: ReactNode;
  onClick?(): void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="btn-opacity p-2"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
