import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MouseEventHandler } from "react";

export default function FilterBarMenuButton({
  onClick,
}: {
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      className="btn-opacity h-[32px] w-[32px]"
      onClick={onClick}
    >
      <FontAwesomeIcon icon={faEllipsisVertical} width={16} height={16} />
    </button>
  );
}
