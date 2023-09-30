import { MouseEventHandler, ReactNode } from "react";

export default function FilterBarButton({
  children,
  disabled,
  className,
  onClick,
  dataIndex,
}: {
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  dataIndex?: number;
}) {
  return (
    <button
      type="button"
      className="btn-opacity flex items-center"
      onClick={onClick}
      disabled={disabled}
      data-index={dataIndex}
    >
      {children}
    </button>
  );
}
