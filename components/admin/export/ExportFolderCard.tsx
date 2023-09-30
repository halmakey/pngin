import FileLinesIcon from "@/components/assets/FileLinesIcon";
import FilmIcon from "@/components/assets/FilmIcon";
import FolderIcon from "@/components/assets/FolderIcon";
import Link from "next/link";

export function ExportFolderCard({
  path,
  json,
  video,
}: {
  path: string;
  json: string;
  video: string;
}) {
  return (
    <div
      key={path}
      className="flex items-center gap-1 border border-gray-800 py-1 px-2 text-sm"
    >
      <FolderIcon height={12} className="fill-cyan-500" />
      {path}
      <Link href={json} target="_blank">
        <button
          type="button"
          className="btn-opacity ml-2 gap-1 rounded-full bg-green-500 fill-white px-2 py-1 font-sans text-xs text-white"
        >
          <FileLinesIcon height={12} width={12} />
          JSON
        </button>
      </Link>
      <Link href={video} target="_blank">
        <button
          type="button"
          className="btn-opacity gap-1 rounded-full bg-violet-500 fill-white px-2 py-1 font-sans text-xs text-white"
        >
          <FilmIcon height={12} width={12} />
          MP4
        </button>
      </Link>
    </div>
  );
}
