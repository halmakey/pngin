import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode, Children } from "react";

export default function BreadCrumb({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xl">
      {Children.map(children, (child, index) => (
        <>
          {!!index && (
            <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
          )}
          {child}
        </>
      ))}
    </div>
  );
}
