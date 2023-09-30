import Link from "next/link";

export default function CollectionCard({
  collection,
}: {
  collection: {
    id: string;
    name: string;
  };
}) {
  return (
    <div className="flex w-[320px] flex-col items-center gap-4 border border-gray-400 bg-white p-4">
      <span className="font-bold">{collection.name}</span>
      <Link href={`/submission/${collection.id}`}>
        <button className="btn-fill">参加する</button>
      </Link>
    </div>
  );
}

export function EmptyCollectionCard({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="flex h-[116px] w-[320px] flex-col items-center justify-center gap-4 border border-gray-400 bg-white p-4">
      <span>
        受付中の出展フォームはありません。
        {!loggedIn ? (
          <>
            出展済みフォームを確認したい場合は
            <Link className="m-0 inline" href="/api/auth/signin">
              ログイン
            </Link>
            してください。
          </>
        ) : (
          <>
            <br />
            自身の出展作品は右上のユーザーメニューから確認できます。
          </>
        )}
      </span>
    </div>
  );
}
