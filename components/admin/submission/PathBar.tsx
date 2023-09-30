import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import CaretRight from "@/components/assets/CaretRight";
import { getAncestorPaths, getPathComponents } from "@/utils/path-utils";
import TrashIcon from "@/components/assets/TrashIcon";
import ArrowUpRightFromSquare from "@/components/assets/ArrowUpRightFromSquare";
import Check from "@/components/assets/Check";
import HouseIcon from "@/components/assets/HouseIcon";
import FilterBar from "../filter-bar/FilterBar";
import FilterBarSection from "../filter-bar/FilterBarSection";
import FilterBarSpace from "../filter-bar/FilterBarSpace";
import FilterMenu from "../filter-bar/FilterMenu";
import FilterBarMenuButton from "../filter-bar/FilterBarMenuButton";
import FilterMenuItem from "../filter-bar/FilterMenuItem";
import FilterBarBorderButton from "../filter-bar/FilterBarBorderButton";
import FilterBarButton from "../filter-bar/FilterBarButton";

export default function PathBar({
  hint,
  selected,
  path,
  onClickPath,
  onBack,
  onCancelSelect,
  onDeletePath,
  onMoveSelection,
  onSelectAll,
}: {
  hint: string;
  selected: boolean;
  path: string;
  onClickPath(path: string): void;
  onBack(): void;
  onCancelSelect(): void;
  onDeletePath?(path: string): void;
  onMoveSelection(): void;
  onSelectAll?(): void;
}) {
  const pathComponents = useMemo(() => getPathComponents(path), [path]);
  const [showMenu, setShowMenu] = useState(false);

  const handleClickPath = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const index = Number(e.currentTarget.dataset.index);
      const nextPath = getAncestorPaths(path)[index + 1];
      onClickPath(nextPath);
    },
    [onClickPath, path]
  );

  const handleShowMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(true);
  }, []);
  const handleClose = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleSelectAll = useCallback(() => {
    setShowMenu(false);
    onSelectAll?.();
  }, [onSelectAll]);

  const handleDeleteFolder = useCallback(() => {
    setShowMenu(false);
    onDeletePath?.(path);
  }, [onDeletePath, path]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.code) {
        case "Escape":
          e.preventDefault();
          onCancelSelect();
          break;
        case "KeyM":
          e.preventDefault();
          onMoveSelection();
      }
    },
    [onCancelSelect, onMoveSelection]
  );

  return (
    <FilterBar onKeyDown={handleKeyDown}>
      <FilterBarSection className="ml-4 gap-2">
        <FilterBarButton
          onClick={handleClickPath}
          disabled={!path}
          dataIndex={-1}
        >
          <HouseIcon height={16} className="mr-2" />
          <CaretRight height={12} />
        </FilterBarButton>
        {pathComponents.map((c, i) =>
          i === pathComponents.length - 1 ? (
            <span key={i} className="font-bold">
              {c}
            </span>
          ) : (
            <FilterBarButton
              key={i}
              data-index={i}
              className="flex items-center fill-white text-white hover:underline"
              onClick={handleClickPath}
            >
              <span>{c}</span>
              <CaretRight className="ml-2" height={12} />
            </FilterBarButton>
          )
        )}
      </FilterBarSection>
      <FilterBarSpace />
      <FilterBarSection className="font-bold">
        {selected ? (
          <>
            <span>{hint}</span>
            <FilterBarSection>
              <FilterBarBorderButton onClick={onMoveSelection}>
                <ArrowUpRightFromSquare height={16} />
                移動 (M)
              </FilterBarBorderButton>
              <FilterBarBorderButton onClick={onMoveSelection}>
                <ArrowUpRightFromSquare height={16} />
                解除 (Esc)
              </FilterBarBorderButton>
            </FilterBarSection>
          </>
        ) : (
          <>
            <span>{hint}</span>
          </>
        )}
      </FilterBarSection>
      <FilterBarSection>
        <FilterBarMenuButton onClick={handleShowMenu} />
      </FilterBarSection>
      {showMenu && (
        <FilterMenu onClose={handleClose}>
          <FilterMenuItem onClick={handleSelectAll} disabled={!onSelectAll}>
            <Check height={16} />
            すべて選択
          </FilterMenuItem>
          <FilterMenuItem onClick={handleDeleteFolder} disabled={!onDeletePath}>
            <TrashIcon height={16} />
            フォルダを削除
          </FilterMenuItem>
        </FilterMenu>
      )}
    </FilterBar>
  );
}
