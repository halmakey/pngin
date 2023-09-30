import { SITE_TITLE } from "@/constants/app";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="h-80 bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <Link href="/" className="text-lg">
          {SITE_TITLE}
        </Link>
      </div>
    </footer>
  );
}
