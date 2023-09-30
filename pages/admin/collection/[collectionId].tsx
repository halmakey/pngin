import Header from "@/components/Header";
import Main from "@/components/Main";
import { useAsyncCallback } from "@/hooks/useAsyncCallback";
import { CollectionModel } from "@/models";
import { Collection } from "@/types/model";
import { userServerSideProps } from "@/utils/ssr/server-side-props";
import { faEdit, faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdminAPI } from "@/utils/api";
import { formatShortDateTime } from "@/utils/format-date-time";
import Link from "next/link";
import BreadCrumb from "@/components/admin/breadcrumb/BreadCrumb";
import BreadCrumbLink from "@/components/admin/breadcrumb/BreadCrumbLink";
import BreadCrumbText from "@/components/admin/breadcrumb/BreadCrumbText";
import PageHeader from "@/components/admin/page-header/PageHeader";
import { MAX_SUBMISSIONS_PER_AUTHOR } from "@/components/submission/constants";

interface Props {
  collection: Collection;
}

export default function CollectionPage({ collection }: Props) {
  const [currentCollection, setCurrentCollection] = useState(collection);

  const nameRef = useRef<HTMLInputElement>(null);
  const sequenceRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const formActiveRef = useRef<HTMLInputElement>(null);
  const visibleRef = useRef<HTMLInputElement>(null);
  const submissionsPerAuthorRef = useRef<HTMLInputElement>(null);

  const { call: handleSubmit, error: submitError } = useAsyncCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!confirm("情報を更新します。よろしいですか？")) {
        return;
      }
      const name = nameRef.current!.value;
      const sequence = Number(sequenceRef.current!.value);
      const url = urlRef.current!.value;
      const formActive = formActiveRef.current!.checked;
      const visible = visibleRef.current!.checked;
      const submissionsPerAuthor = Number(
        submissionsPerAuthorRef.current!.value
      );
      console.log({
        name,
        sequence,
        url,
        formActive,
        visible,
      });
      const { collection: nextCollection } = await AdminAPI.putAdminCollection(
        collection.id,
        {
          name,
          sequence,
          url,
          formActive,
          visible,
          submissionsPerAuthor,
        }
      );
      setCurrentCollection(nextCollection);
      alert("更新しました。");
    },
    [collection.id]
  );
  useEffect(() => {
    if (!submitError) {
      return;
    }
    alert(String(submitError));
  }, [submitError]);

  const submissionUrl = useMemo(() => {
    if (typeof window !== "object") {
      return `/submission/${currentCollection.id}`;
    }
    return `${window.location.origin}/submission/${currentCollection.id}`;
  }, [currentCollection.id]);
  return (
    <>
      <Header label={["設定"]} />
      <Main className="gap-4">
        <PageHeader>
          <BreadCrumb>
            <BreadCrumbLink href="/admin">{collection.name}</BreadCrumbLink>
            <BreadCrumbText>設定</BreadCrumbText>
          </BreadCrumb>
        </PageHeader>
        <form
          key={currentCollection.timestamp}
          onSubmit={handleSubmit}
          className="flex flex-col items-start gap-2 border border-gray-800 p-4"
        >
          <label className="mt-4 text-sm font-bold">ID</label>
          <input
            className="bg-gray-300 p-2"
            name="id"
            defaultValue={currentCollection.id}
            readOnly
            disabled
          />
          <label className="mt-4 text-sm font-bold">
            出展フォームへのリンク
          </label>
          <Link suppressHydrationWarning href={submissionUrl} target="_blank">
            {submissionUrl}
          </Link>
          <label className="mt-4 text-sm font-bold">更新日時</label>
          <input
            className="bg-gray-300 p-2"
            name="timestamp"
            defaultValue={formatShortDateTime(currentCollection.timestamp)}
            readOnly
            disabled
          />
          <label className="mt-4 text-sm font-bold">名称</label>
          <input
            ref={nameRef}
            className="border border-gray-800 p-2"
            name="name"
            maxLength={256}
            defaultValue={currentCollection.name}
          />
          <label className="mt-4 text-sm font-bold">連番</label>
          <input
            ref={sequenceRef}
            className="border border-gray-800 p-2"
            type="number"
            name="sequence"
            min={-9999}
            max={9999}
            defaultValue={currentCollection.sequence}
            step="0.1"
          />
          <span className="text-xs">
            コレクションを並べたときの順番。PNG Museum 3 ならば 3
          </span>
          <label className="mt-4 text-sm font-bold">
            ユーザー毎の最大出展作品数
          </label>
          <input
            ref={submissionsPerAuthorRef}
            className="border border-gray-800 p-2"
            type="number"
            name="sequence"
            min={1}
            max={MAX_SUBMISSIONS_PER_AUTHOR}
            defaultValue={currentCollection.submissionsPerAuthor}
          />
          <label className="mt-4 text-sm font-bold">URL</label>
          <input
            ref={urlRef}
            className="border border-gray-800 p-2"
            type="url"
            name="url"
            maxLength={1024}
            defaultValue={currentCollection.url}
          />
          <span className="text-xs">募集要項のURLなど</span>
          <label className="mt-4 text-sm font-bold">出展フォーム</label>
          <div className="flex gap-2">
            <div className="flex gap-1">
              <input
                ref={formActiveRef}
                type="radio"
                id="formActive"
                name="formActive"
                defaultChecked={currentCollection.formActive}
              />
              <label htmlFor="formActive">有効</label>
            </div>
            <div className="flex gap-1">
              <input
                type="radio"
                id="formDeactive"
                name="formActive"
                defaultChecked={!currentCollection.formActive}
              />
              <label htmlFor="formDeactive">無効</label>
            </div>
          </div>
          <ul className="list-disc pl-8 text-xs">
            <li>有効 - 出展フォームで作品の出展・編集と編集を受け付ける</li>
            <li>
              無効 -
              出展フォームは読み込み専用（ただしリジェクトされている作品は編集可能）
            </li>
          </ul>{" "}
          <label className="mt-4 text-sm font-bold">表示設定</label>
          <div className="flex gap-2">
            <div className="flex gap-1">
              <input
                ref={visibleRef}
                type="radio"
                id="visible"
                name="visible"
                defaultChecked={currentCollection.visible}
              />
              <label htmlFor="visible">表示</label>
            </div>
            <div className="flex gap-1">
              <input
                type="radio"
                id="hidden"
                name="visible"
                defaultChecked={!currentCollection.visible}
              />
              <label htmlFor="hidden">非表示</label>
            </div>
          </div>
          <ul className="list-disc pl-8 text-xs">
            <li>表示 - トップページに出展フォームへのリンクが表示される</li>
            <li>
              非表示 -
              トップページに出展フォームへのリンクが表示されない。ただし出展者はメニューから辿れる
            </li>
          </ul>
          <div className="mt-10 flex gap-2">
            <button type="reset" className="btn-border">
              <FontAwesomeIcon width={16} icon={faRefresh} />
              リセット
            </button>
            <button type="submit" className="btn-fill">
              <FontAwesomeIcon width={16} icon={faEdit} />
              更新
            </button>
          </div>
        </form>
      </Main>
    </>
  );
}

export const getServerSideProps = userServerSideProps<Props>(
  "admin",
  async ({ params }) => {
    const collectionId = params!.collectionId as string;
    const collection = await CollectionModel.getCollection(collectionId);
    if (!collection) {
      return {
        notFound: true,
      };
    }
    return {
      props: {
        collection,
      },
    };
  }
);
