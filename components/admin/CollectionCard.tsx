import { Collection } from "@/types/model";
import {
  faGear,
  faImages,
  faUsers,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Link from "next/link";
import { Dot } from "../Dot";

export interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <div className="flex flex-col gap-4 border border-gray-800 p-4">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{collection.name}</span>
          <div className="flex items-center gap-4">
            <Dot color={collection.formActive ? "green" : "gray"}>
              {collection.formActive ? "出展フォーム有効" : "出展フォーム無効"}
            </Dot>
            <Dot color={collection.visible ? "green" : "gray"}>
              {collection.visible ? "リンク表示中" : "リンク非表示"}
            </Dot>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm"></div>
      </div>
      <div className="flex flex-wrap gap-2 self-end">
        <Link href={`/admin/collection/${collection.id}`} prefetch={false}>
          <button className="btn-fill">
            <FontAwesomeIcon icon={faGear} />
            設定
          </button>
        </Link>
        <Link
          href={`/admin/collection/${collection.id}/author`}
          prefetch={false}
        >
          <button className="btn-fill">
            <FontAwesomeIcon icon={faUsers} />
            出展者一覧
          </button>
        </Link>
        <Link
          href={`/admin/collection/${collection.id}/submission`}
          prefetch={false}
        >
          <button className="btn-fill">
            <FontAwesomeIcon icon={faImages} />
            出展作品一覧
          </button>
        </Link>
        <Link
          href={`/admin/collection/${collection.id}/export`}
          prefetch={false}
        >
          <button className="btn-fill">
            <FontAwesomeIcon icon={faFloppyDisk} />
            エクスポート
          </button>
        </Link>
      </div>
    </div>
  );
}

export function EmptyCollectionCard() {
  return (
    <div className="flex h-[116px] flex-col gap-4 border border-gray-800 p-4">
      コレクションがありません。
    </div>
  );
}
