import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type CheckMessageColor = "green" | "gray" | "orange" | "red";

const COLOR_STYLES: Record<CheckMessageColor, string> = {
  green: "text-green-800 border-green-800 bg-green-100",
  gray: "text-zinc-600 border-zinc-600 bg-zinc-100",
  orange: "text-orange-700 border-orange-700 bg-orange-100",
  red: "text-red-700 border-red-700 bg-red-100",
};

export default function CheckMessage({
  children,
  color,
}: {
  children: string;
  color: CheckMessageColor;
}) {
  return (
    <div className={`flex gap-2 p-3 ${COLOR_STYLES[color]} border`}>
      <div className={`${COLOR_STYLES[color]}`}>
        <FontAwesomeIcon icon={faCircleInfo} />
      </div>
      {children}
    </div>
  );
}
