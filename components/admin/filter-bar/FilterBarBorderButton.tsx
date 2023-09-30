import { MouseEventHandler, ReactNode } from "react";

export default function FilterBarBorderButton({
  children,
  onClick,
}: {
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button type="button" className="btn-border-invert p-2" onClick={onClick}>
      {children}
    </button>
  );
}
