import Link from "next/link";
import { ReactNode } from "react";
import { UrlObject } from "url";

export default function BreadCrumbLink({
  href,
  children,
}: {
  href: UrlObject | string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="btn-opacity text-xl font-bold text-black hover:underline"
    >
      {children}
    </Link>
  );
}
