import Header from "@/components/Header";
import Main from "@/components/Main";
import BreadCrumb from "@/components/admin/breadcrumb/BreadCrumb";
import BreadCrumbLink from "@/components/admin/breadcrumb/BreadCrumbLink";
import BreadCrumbText from "@/components/admin/breadcrumb/BreadCrumbText";
import UserCard from "@/components/admin/UserCard";
import RejectForm from "@/components/admin/author/RejectForm";
import ImageCard from "@/components/admin/image/ImageCard";
import Selectable from "@/components/admin/image/Selectable";
import Preview from "@/components/admin/preview/Preview";
import useAdminUser from "@/hooks/useAdminUser";
import {
  AuthorModel,
  CollectionModel,
  RejectModel,
  SubmissionModel,
} from "@/models";
import {
  Author,
  AuthorID,
  Collection,
  Reject,
  Submission,
} from "@/types/model";
import { formatShortDateTime } from "@/utils/format-date-time";
import { userServerSideProps } from "@/utils/ssr/server-side-props";
import { useRouter } from "next/router";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AdminAPI } from "@/utils/api";
import useAdminAuthor from "@/hooks/uesAdminAuthor";
import useAdminAuthorSubmissions from "@/hooks/useAdminAuthorSubmisisons";
import { HttpStatusError } from "@/utils/api/error";
import PageHeader from "@/components/admin/page-header/PageHeader";
import useAdminReject from "@/hooks/useAdminReject";

interface Props {
  author: Author;
  submissions: Submission[];
  collection: Collection;
  reject: Reject | null;
}

export default function ImageCollection({
  reject: initialReject,
  author: initialAuthor,
  submissions: initialSubmissions,
  collection,
}: Props) {
  const collectionId = collection.id;
  const userId = initialAuthor.userId;
  const authorId = initialAuthor.id;
  const router = useRouter();

  const {
    data: { submissions },
  } = useAdminAuthorSubmissions(authorId, initialSubmissions, true);
  const {
    data: { author },
    error,
  } = useAdminAuthor(authorId, initialAuthor, true);

  useEffect(() => {
    if (error instanceof HttpStatusError && error.status === 404) {
      router.reload();
    }
  }, [author.id, error, router]);

  const {
    data: { reject },
  } = useAdminReject(author.id, initialReject, true);

  const [cursor, setCursor] = useState(-1);
  const [selection, setSelection] = useState(() => {
    const imageIds = [author.imageId, ...submissions.map((s) => s.imageId)];
    return new Set<string>(
      reject?.imageIds.filter((iid) => imageIds.includes(iid)) ?? []
    );
  });
  const cursorIds = useMemo(
    () => [author.imageId, ...submissions.map((s) => s.imageId)],
    [author.imageId, submissions]
  );
  const viewIndex = Number(router.query?.view);
  const viewImage = useMemo(() => {
    if (viewIndex === 0) {
      return {
        index: viewIndex,
        id: author.imageId,
        width: 700,
        height: 400,
      };
    }
    const submission = submissions[viewIndex - 1];
    if (submission) {
      return {
        index: viewIndex,
        id: submission.imageId,
        width: submission.width,
        height: submission.height,
      };
    }
  }, [author.imageId, submissions, viewIndex]);

  const handleClose = useCallback(() => {
    router.push({
      query: {
        collectionId,
        authorId,
      },
    });
  }, [collectionId, authorId, router]);

  const canPrev = viewImage && viewImage.index > 0;
  const canNext = viewImage && viewImage.index < submissions.length;

  const handlePrev = useCallback(() => {
    router.replace({
      query: {
        collectionId,
        authorId,
        view: viewIndex - 1,
      },
    });
  }, [collectionId, authorId, router, viewIndex]);

  const handleNext = useCallback(() => {
    router.replace({
      query: {
        collectionId,
        authorId: authorId,
        view: viewIndex + 1,
      },
    });
  }, [collectionId, authorId, router, viewIndex]);

  const { data: userData } = useAdminUser(userId);

  const clearSelection = useCallback(() => {
    const imageIds = [author.imageId, ...submissions.map((s) => s.imageId)];
    const nextSelection = new Set<string>(
      reject?.imageIds.filter((iid) => imageIds.includes(iid)) ?? []
    );

    setSelection(nextSelection);
  }, [author.imageId, reject?.imageIds, submissions]);

  const toggleSelection = useCallback(
    (imageId: string) => {
      selection.has;
      if (selection.has(imageId)) {
        selection.delete(imageId);
      } else {
        selection.add(imageId);
      }
      setSelection(new Set(selection));
    },
    [selection]
  );

  const openPreview = useCallback(() => {
    if (cursor < 0) {
      return;
    }
    router.push({
      query: {
        collectionId: collection.id,
        authorId,
        view: cursor,
      },
    });
  }, [authorId, collection.id, cursor, router]);

  const navigateOffset = useCallback(
    (offset: number) => {
      setCursor((cursor) =>
        Math.min(submissions.length, Math.max(0, cursor + offset))
      );
    },
    [submissions.length]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (viewImage) {
        return;
      }
      if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
        return;
      }
      switch (e.code) {
        case "Escape":
          e.preventDefault();
          if (cursor >= 0) {
            setCursor(-1);
            return;
          }
          clearSelection();
          break;
        case "KeyX":
          e.preventDefault();
          if (cursor < 0) {
            return;
          }
          if (cursor === 0) {
            toggleSelection(author.imageId);
            return;
          }
          const submission = submissions[cursor - 1];
          if (submission) {
            toggleSelection(submission.imageId);
            return;
          }
          break;
        case "KeyO":
        case "Space": {
          e.preventDefault();
          openPreview();
          break;
        }
        case "KeyL":
        case "ArrowRight":
          e.preventDefault();
          navigateOffset(1);
          break;
        case "KeyH":
        case "ArrowLeft":
          e.preventDefault();
          navigateOffset(-1);
          break;
        case "KeyK":
        case "ArrowUp":
          e.preventDefault();
          navigateOffset(-1);
          break;
        case "KeyJ":
        case "ArrowDown":
          e.preventDefault();
          if (cursor < 0) {
            navigateOffset(1);
            return;
          }
          navigateOffset(1);
          break;
        default:
          console.log(e.code);
          break;
      }
    },
    [
      author.imageId,
      clearSelection,
      cursor,
      navigateOffset,
      openPreview,
      submissions,
      toggleSelection,
      viewImage,
    ]
  );

  const handleClickImage = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const currentTargetId = e.currentTarget.id;
      const index = cursorIds.findIndex((id) => id === currentTargetId);
      if (index === -1) {
        return;
      }

      if (e.shiftKey) {
        const origin = cursor >= 0 ? cursor : index;
        const start = Math.min(origin, index);
        const end = Math.max(origin, index);

        const selected = !selection.has(currentTargetId);
        const targetIds = cursorIds.slice(start, end + 1);

        setSelection((selection) => {
          if (selected) {
            targetIds.forEach((id) => selection.add(id));
          } else {
            targetIds.forEach((id) => selection.delete(id));
          }
          return new Set(selection);
        });
        setCursor(index);
        return;
      }

      if (index === cursor) {
        openPreview();
      } else {
        setCursor(index);
      }
    },
    [cursor, cursorIds, openPreview, selection]
  );

  const handleCheckImage = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!e.currentTarget) {
        return;
      }

      toggleSelection(e.currentTarget.id);
    },
    [toggleSelection]
  );

  const reload = useCallback(() => {
    router.reload();
  }, [router]);

  return (
    <>
      <Header label={["出展者詳細"]} />
      <Main className="items-start gap-8">
        <PageHeader>
          <BreadCrumb>
            <BreadCrumbLink href="/admin">{collection.name}</BreadCrumbLink>
            <BreadCrumbLink href={`/admin/collection/${collection.id}/author`}>
              出展者
            </BreadCrumbLink>
            <BreadCrumbText>{author.name}</BreadCrumbText>
          </BreadCrumb>
        </PageHeader>
        <div onKeyDown={onKeyDown}>
          <div className="flex gap-8">
            <Selectable
              color="red"
              id={author.imageId}
              focus={cursor === 0}
              selected={selection.has(author.imageId)}
              draggable={false}
              onCheck={handleCheckImage}
              onClick={handleClickImage}
              scale
            >
              <ImageCard
                imageId={author.imageId}
                thumbnailSize="original"
                width={350}
                height={200}
                hint={
                  !!reject?.imageIds.includes(author.imageId)
                    ? "alert"
                    : undefined
                }
              />
            </Selectable>
            <div className="flex flex-col items-start gap-4">
              <div>
                <UserCard user={userData?.user} />
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="authorName" className="font-bold">
                    出展者名
                  </label>
                  <input
                    id="authorName"
                    value={author.name}
                    readOnly
                    disabled
                    className="border border-gray-800 p-2"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="timestamp" className="font-bold">
                    最終更新日時
                  </label>
                  <input
                    id="timestamp"
                    value={formatShortDateTime(author.timestamp)}
                    readOnly
                    disabled
                    className="border border-gray-800 p-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div onKeyDown={onKeyDown}>
          <h2>出展作品</h2>
          <div className="flex flex-wrap gap-4">
            {submissions.map((s, i) => (
              <Selectable
                color="red"
                key={i}
                id={s.imageId}
                focus={cursor === i + 1}
                selected={selection.has(s.imageId)}
                onCheck={handleCheckImage}
                onClick={handleClickImage}
                scale
              >
                <ImageCard
                  key={s.id}
                  imageId={s.imageId}
                  thumbnailSize={300}
                  width={300}
                  height={300}
                  hint={
                    !!reject?.imageIds.includes(s.imageId) ? "alert" : undefined
                  }
                />
              </Selectable>
            ))}
          </div>
        </div>
        <RejectForm
          author={author ?? initialAuthor}
          reject={reject}
          selection={selection}
          onDelete={reload}
          onSubmit={reload}
        />
      </Main>
      <Preview
        image={viewImage}
        author={!viewIndex ? undefined : author ?? initialAuthor}
        onClose={handleClose}
        onNext={canNext ? handleNext : undefined}
        onPrev={canPrev ? handlePrev : undefined}
      />
    </>
  );
}

export const getServerSideProps = userServerSideProps<Props>(
  "admin",
  async ({ params }) => {
    const collectionId = params!.collectionId as string;
    const authorId = params!.authorId as AuthorID;

    const [collection, author, reject] = await Promise.all([
      CollectionModel.getCollection(collectionId),
      AuthorModel.getAuthor(authorId),
      RejectModel.getReject(authorId),
    ]);
    if (!collection || !author) {
      return {
        notFound: true,
      };
    }
    const submissions = await SubmissionModel.findSubmissionsByAuthor(authorId);
    return {
      props: {
        collection,
        author,
        submissions,
        reject: reject || null,
      },
    };
  }
);
