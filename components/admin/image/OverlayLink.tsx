import Link from "next/link";
import { ReactNode } from "react";
import { UrlObject } from "url";

export default function OverlayLink({
  children,
  label,
  href,
}: {
  children?: ReactNode;
  label?: string;
  href: UrlObject | string;
}) {
  return (
    <Link href={href}>
      <div className="relative">
        {children}
        <div className="absolute left-0 top-0 bottom-0 right-0 bg-gradient-to-b from-black/50 p-2 text-white opacity-0 hover:opacity-100">
          {label}
        </div>
      </div>
    </Link>
  );
}

export function EmptyAuthorCard() {
  return <div className="w-[210px]"></div>;
}
