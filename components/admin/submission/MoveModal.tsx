import { useCallback, useMemo, useRef, useState } from "react";
import { FolderSelector } from "./FolderSelector";
import useBlockCallback from "@/hooks/useBlockCallback";
import {
  getLastPathComponent,
  getPathComponents,
  pathContains,
  slicePath,
} from "@/utils/path-utils";
import { CollectionPath } from "@/types/model";
import HouseIcon from "@/components/assets/HouseIcon";
import CaretRight from "@/components/assets/CaretRight";

export default function MoveModal({
  count,
  defaultPath,
  paths,
  onCancel,
  onMove,
}: {
  count: number;
  defaultPath: string;
  paths: CollectionPath[];
  onCancel(): void;
  onMove(path: string): void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPath, setCurrentPath] = useState(() => defaultPath);
  const pathComponents = useMemo(
    () => getPathComponents(currentPath),
    [currentPath]
  );

  const handleSelectFolder = useCallback(
    (index: number, folder: string) => {
      const nextPathComponents = pathComponents.slice(0, index + 1);
      nextPathComponents[index] = folder;
      setCurrentPath(nextPathComponents.join("/"));
    },
    [pathComponents]
  );

  const handleOpenFolder = useCallback(
    (i: number) => {
      const parent = slicePath(currentPath, i);
      return paths
        .filter(
          (p) =>
            pathContains(parent, p.path) &&
            getPathComponents(p.path).length === i + 1
        )
        .map((p) => getLastPathComponent(p.path));
    },
    [currentPath, paths]
  );

  const handleOk = useCallback(() => {
    setCurrentPath(defaultPath);
    onMove(currentPath);
  }, [currentPath, defaultPath, onMove]);

  const handleCancel = useCallback(() => {
    setCurrentPath(defaultPath);
    onCancel();
  }, [defaultPath, onCancel]);

  const handleHome = useCallback(() => {
    setCurrentPath("");
  }, []);

  useBlockCallback(containerRef, onCancel);

  return (
    <div
      ref={containerRef}
      className="fixed z-20 h-full w-full bg-black/50 backdrop-blur backdrop-grayscale"
    >
      <div className="absolute h-full w-full" onClick={handleCancel} />
      <div className="container mx-auto flex h-full flex-col px-10">
        <div className="mt-[200px] flex flex-col gap-4 rounded bg-sky-800/80 fill-white p-8 text-white backdrop-blur">
          <div className="text-lg font-bold">{count}件のファイルを移動</div>
          <div className="flex min-h-[40px] items-center bg-black/20 px-4 py-2">
            <button
              type="button"
              className="btn-opacity"
              onClick={handleHome}
              disabled={!currentPath}
            >
              <HouseIcon height={16} />
              <CaretRight height={12} className="mr-2" />
            </button>
            {pathComponents.map((path, i) => (
              <FolderSelector
                key={i}
                index={i}
                value={path}
                onOpen={handleOpenFolder}
                onSelect={handleSelectFolder}
              />
            ))}
            <FolderSelector
              key={pathComponents.length}
              index={pathComponents.length}
              value={""}
              onOpen={handleOpenFolder}
              onSelect={handleSelectFolder}
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="btn-border-invert"
              onClick={handleCancel}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="btn-fill-invert"
              onClick={handleOk}
              disabled={currentPath === defaultPath}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
