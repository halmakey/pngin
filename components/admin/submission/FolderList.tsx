import CirclePlus from "@/components/assets/CirclePlus";
import FolderIcon from "@/components/assets/FolderIcon";
import { DragEvent, MouseEvent, useCallback, useState } from "react";
import FolderInput from "./FolderInput";

export interface FolderItem {
  name: string;
  count: number;
}

export default function FolderList({
  folders,
  canAddFolder,
  onClickFolder,
  onAddFolder,
  onDropFolder,
  onDropOther,
}: {
  folders: FolderItem[];
  canAddFolder: boolean;
  onClickFolder(folder: string): void;
  onAddFolder(folder: string): void;
  onDropFolder(from: string, to: string): void;
  onDropOther(from: DataTransfer, to: string): void;
}) {
  const [inputFolderMode, setInputFolderMode] = useState(false);
  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const folder = e.currentTarget.dataset.folder as string;
      if (!folder) {
        return;
      }
      onClickFolder(folder);
    },
    [onClickFolder]
  );
  const handleAddFolderClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInputFolderMode(true);
  }, []);

  const handleSubmitFolder = useCallback(
    (_: number, value: string) => {
      onAddFolder(value);
      setInputFolderMode(false);
    },
    [onAddFolder]
  );

  const handleCancelFolder = useCallback(() => {
    setInputFolderMode(false);
  }, []);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
    const folder = e.currentTarget.dataset.folder as string;
    e.dataTransfer.setData("folder", folder);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.dropEffect = "move";
  }, []);
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      const to = e.currentTarget.dataset.folder as string;
      const from = e.dataTransfer.getData("folder");
      if (from) {
        onDropFolder(from, to);
        return;
      }
      onDropOther(e.dataTransfer, to);
    },
    [onDropFolder, onDropOther]
  );

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {folders.map(({ name, count }) => (
        <div
          className="flex min-h-[40px] min-w-[128px] items-center overflow-hidden text-ellipsis border border-gray-500 p-2 hover:bg-gray-200 active:bg-gray-400"
          tabIndex={0}
          key={name}
          data-folder={name}
          onClick={handleClick}
          draggable
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <FolderIcon height={16} className="mr-2 fill-cyan-500" />
          {name}
          <span className="ml-4 flex-1 text-end text-sm font-bold text-slate-400">
            {count}
          </span>
        </div>
      ))}
      {canAddFolder && !inputFolderMode && (
        <div
          tabIndex={0}
          className="flex h-[40px] min-w-[128px] items-center overflow-hidden text-ellipsis border border-dashed border-gray-500 p-2 hover:bg-gray-200 active:bg-gray-400"
          onClick={handleAddFolderClick}
        >
          <CirclePlus height={16} className="mr-2 fill-gray-500" />
          フォルダを追加
        </div>
      )}
      {inputFolderMode && (
        <FolderInput
          index={0}
          onSubmit={handleSubmitFolder}
          onCancel={handleCancelFolder}
        />
      )}
    </div>
  );
}
