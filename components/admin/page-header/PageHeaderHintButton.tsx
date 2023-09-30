import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";

export default function PageHeaderHintButton({
  children,
  onClick,
}: {
  children?: ReactNode;
  onClick?(): void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2">
      {children}
    </button>
  );
}
