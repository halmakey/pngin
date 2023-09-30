import PathBar from "@/components/admin/submission/PathBar";
import ImageCard, { EmptyImageCard } from "@/components/admin/image/ImageCard";
import Preview from "@/components/admin/preview/Preview";
import Header from "@/components/Header";
import Main from "@/components/Main";
import useResizeMemo from "@/hooks/useResizeMemo";
import { userServerSideProps } from "@/utils/ssr/server-side-props";
import { useRouter } from "next/router";
import {
  DragEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAsyncCallback } from "@/hooks/useAsyncCallback";
import { AdminAPI } from "@/utils/api";
import MoveModal from "@/components/admin/submission/MoveModal";
import FolderList from "@/components/admin/submission/FolderList";
import {
  Author,
  Collection,
  CollectionPath,
  Submission,
  SubmissionID,
} from "@/types/model";
import {
  AuthorModel,
  CollectionModel,
  CollectionPathModel,
  SubmissionModel,
} from "@/models";
import {
  getLastPathComponent,
  getParentPath,
  getPathComponents,
  joinPath,
  pathContains,
} from "@/utils/path-utils";
import BreadCrumb from "@/components/admin/breadcrumb/BreadCrumb";
import BreadCrumbLink from "@/components/admin/breadcrumb/BreadCrumbLink";
import BreadCrumbText from "@/components/admin/breadcrumb/BreadCrumbText";
import Selectable from "@/components/admin/image/Selectable";
import PageHeader from "@/components/admin/page-header/PageHeader";
import PageHeaderHint from "@/components/admin/page-header/PageHeaderHint";
import { format } from "date-fns";
import { stringify } from "csv-stringify/sync";
import iconv from "iconv-lite";
import PageHeaderHintButton from "@/components/admin/page-header/PageHeaderHintButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";

const rejectStatusToHint = {
  reject: "alert",
  review: "info",
} as const;

interface Props {
  collection: Collection;
  submissions: Submission[];
  authors: Author[];
  collectionPaths: CollectionPath[];
}

export default function ImageCollection({
  collection,
  submissions,
  authors,
  collectionPaths,
}: Props) {
  const router = useRouter();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const viewId = router.query.view as string;
  const viewMode = !!viewId;
  const [currentCollection, setCurrentCollection] = useState(collection);
  const [currentCollectionPaths, setCurrentCollectionPaths] =
    useState(collectionPaths);
  const currentPath = useMemo(
    () => (router.query.path && String(router.query.path)) || "",
    [router.query.path]
  );
  const [currentSubmissions, setCurrentSubmissions] = useState(submissions);
  const currentSubmissionMap = useMemo(
    () =>
      currentSubmissions.reduce<Record<SubmissionID, Submission>>(
        (p, c) => ({ ...p, [c.id]: c }),
        {}
      ),
    [currentSubmissions]
  );
  const currentCollectionPath = useMemo(
    () => currentCollectionPaths.find((p) => p.path === currentPath),
    [currentCollectionPaths, currentPath]
  );
  const currentSubmissionIds = useMemo(() => {
    const submissionIds =
      currentCollectionPath?.submissionIds.filter(
        (sid) => currentSubmissionMap[sid]
      ) ?? [];
    if (currentPath) {
      return submissionIds;
    }

    let usedSubmissionIds: SubmissionID[] = submissionIds.slice();
    for (const collectionPath of currentCollectionPaths) {
      if (!collectionPath.path) {
        continue;
      }
      usedSubmissionIds = [
        ...usedSubmissionIds,
        ...collectionPath.submissionIds,
      ];
    }
    const orphans = currentSubmissions
      .map((s) => s.id)
      .filter((sid) => !usedSubmissionIds.includes(sid));

    const currentSubmissionIds = [...submissionIds, ...orphans];
    return currentSubmissionIds;
  }, [
    currentCollectionPath?.submissionIds,
    currentCollectionPaths,
    currentPath,
    currentSubmissionMap,
    currentSubmissions,
  ]);
  const [cursor, setCursor] = useState<number>(
    currentSubmissionIds.indexOf(viewId as SubmissionID)
  );
  const cursorId = currentSubmissionIds[cursor];
  const cursorSubmission = currentSubmissionMap[cursorId];
  const cursorImage = useMemo(
    () =>
      cursorSubmission && {
        id: cursorSubmission.imageId,
        width: cursorSubmission.width,
        height: cursorSubmission.height,
      },
    [cursorSubmission]
  );
  const [selection, setSelection] = useState<Set<SubmissionID>>(new Set());
  const authorIdMap = useMemo(
    () =>
      authors.reduce<Record<string, Author>>(
        (p, c) => ({ ...p, [c.id]: c }),
        {}
      ),
    [authors]
  );
  const selectedAuthor = useMemo<Author | undefined>(
    () => cursorSubmission && authorIdMap[cursorSubmission?.authorId],
    [authorIdMap, cursorSubmission]
  );

  const {
    data: { rejects },
  } = useSWR(
    `reject:${collection.id}`,
    () => AdminAPI.getAdminCollectionRejects(collection.id),
    {
      fallbackData: {
        rejects: [],
      },
    }
  );
  const imageRejectStatus = useMemo(() => {
    if (!rejects) {
      return {};
    }
    return rejects.reduce<Record<string, "reject" | "review">>((p, c) => {
      for (const imageId of c.imageIds) {
        p[imageId] = c.status;
      }
      return p;
    }, {});
  }, [rejects]);

  const { ref: containerRef, value: columnCount } = useResizeMemo<
    HTMLDivElement,
    number
  >((entry) => {
    if (!entry) {
      return 1;
    }
    const baseline = entry.target.children[0]?.getBoundingClientRect().top ?? 0;
    for (let index = 0; index < entry.target.children.length; index++) {
      const child = entry.target.children[index];
      if (child.getBoundingClientRect().top > baseline) {
        return index;
      }
    }
    return 1;
  }, []);

  const openMoveModal = useCallback(() => {
    setShowMoveModal(true);
  }, []);

  const navigatePath = useCallback(
    (path: string) => {
      setCursor(-1);
      setSelection(new Set());
      router.push(
        {
          pathname: "/admin/collection/[collectionId]/submission",
          query: {
            ...router.query,
            path,
          },
        },
        undefined,
        {
          shallow: true,
        }
      );
    },
    [router]
  );

  const navigateOffset = useCallback(
    (offset: number) => {
      setCursor((s) => {
        const next = Math.max(
          Math.min(s + offset, currentSubmissionIds.length - 1),
          0
        );
        if (!viewMode && offset !== 0) {
          return next;
        }
        const nextSubmissionId = currentSubmissionIds[next];
        router.push(
          {
            pathname: "/admin/collection/[collectionId]/submission",
            query: {
              ...router.query,
              collectionId: currentCollection.id,
              ...(nextSubmissionId && { view: nextSubmissionId }),
            },
          },
          undefined,
          {
            shallow: true,
          }
        );
        return next;
      });
    },
    [currentCollection.id, currentSubmissionIds, router, viewMode]
  );

  const closeView = useCallback(() => {
    if (!viewMode) {
      return;
    }
    const query = { ...router.query };
    delete query.view;
    router.push(
      {
        pathname: "/admin/collection/[collectionId]/submission",
        query: {
          ...query,
          collectionId: currentCollection.id,
        },
      },
      undefined,
      {
        shallow: true,
      }
    );
  }, [currentCollection.id, router, viewMode]);

  const openView = useCallback(() => {
    navigateOffset(0);
  }, [navigateOffset]);

  const navigatePrev = useMemo(
    () =>
      currentSubmissionIds.length > 0 && cursor !== 0
        ? navigateOffset.bind(undefined, -1)
        : undefined,
    [currentSubmissionIds.length, navigateOffset, cursor]
  );
  const navigateNext = useMemo(
    () =>
      currentSubmissionIds.length > 0 &&
      cursor < currentSubmissionIds.length - 1
        ? navigateOffset.bind(undefined, 1)
        : undefined,
    [currentSubmissionIds.length, navigateOffset, cursor]
  );

  const toggleSelection = useCallback(
    (id: SubmissionID) => {
      if (selection.has(id)) {
        selection.delete(id);
      } else {
        selection.add(id);
      }
      setSelection(new Set(selection));
    },
    [selection]
  );

  const cancelSelect = useCallback(() => {
    setSelection(new Set());
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (viewMode || showMoveModal) {
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
          cancelSelect();
          break;
        case "KeyX":
          e.preventDefault();
          if (cursor < 0) {
            return;
          }
          const id = currentSubmissionIds[cursor];
          toggleSelection(id);
          break;
        case "KeyO":
        case "Space": {
          e.preventDefault();
          openView();
          break;
        }
        case "KeyM":
          e.preventDefault();
          if (selection.size) {
            openMoveModal();
          }
          break;
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
          navigateOffset(-columnCount);
          break;
        case "KeyJ":
        case "ArrowDown":
          e.preventDefault();
          if (cursor < 0) {
            navigateOffset(1);
            return;
          }
          navigateOffset(columnCount);
          break;
        default:
          console.log(e.code);
          break;
      }
    },
    [
      cancelSelect,
      columnCount,
      currentSubmissionIds,
      cursor,
      navigateOffset,
      openMoveModal,
      openView,
      selection.size,
      showMoveModal,
      toggleSelection,
      viewMode,
    ]
  );

  const selectAll = useCallback(() => {
    setSelection(new Set(currentSubmissionIds));
  }, [currentSubmissionIds]);

  const selectRange = useCallback(
    (targetIndex: number) => {
      const submissionId = currentSubmissionIds[targetIndex];
      if (!submissionId) {
        return;
      }

      const prevCursor = cursor >= 0 ? cursor : targetIndex;
      const nextState = !selection.has(submissionId);

      const startCursor = Math.min(prevCursor, targetIndex);
      const endCursor = Math.max(prevCursor, targetIndex);

      const selections = currentSubmissionIds.slice(startCursor, endCursor + 1);

      selections.forEach(
        nextState ? (v) => selection.add(v) : (v) => selection.delete(v)
      );
      setSelection(new Set(selection));
      setCursor(targetIndex);
    },
    [currentSubmissionIds, cursor, selection]
  );

  const handleClickSubmission = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const submissionId = e.currentTarget.id as SubmissionID;
      const index = currentSubmissionIds.indexOf(submissionId);

      if (e.shiftKey) {
        selectRange(index);
        return;
      }
      if (cursor != index) {
        setCursor(index);
        return;
      }

      router.push(
        {
          pathname: "/admin/collection/[collectionId]/submission",
          query: {
            ...router.query,
            collectionId: currentCollection.id,
            view: submissionId,
          },
        },
        undefined,
        {
          shallow: true,
        }
      );
    },
    [currentCollection.id, currentSubmissionIds, cursor, router, selectRange]
  );

  const handleContainerClick = useCallback(() => {
    containerRef.current?.focus({
      preventScroll: true,
    });
  }, [containerRef]);

  const handleBack = useCallback(() => {
    const nextPath = getParentPath(currentPath);
    navigatePath(nextPath);
  }, [currentPath, navigatePath]);

  const { call: handleMove } = useAsyncCallback(
    async (path: string) => {
      setShowMoveModal(false);

      const { collectionPaths } = await AdminAPI.putAdminSubmissionPaths(
        currentCollection.id,
        {
          path,
          submissionIds: Array.from(selection),
        }
      );
      setCurrentCollectionPaths(collectionPaths);
      setSelection(new Set());
      setCursor(-1);
    },
    [currentCollection.id, selection]
  );

  const handleCancelMove = useCallback(() => {
    setShowMoveModal(false);
  }, []);

  const handleClickCheck = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const submissionId = e.currentTarget.id as SubmissionID;
      const nextCursor = currentSubmissionIds.indexOf(submissionId);

      if (!e.shiftKey) {
        toggleSelection(submissionId);
        setCursor(nextCursor);
        return;
      }

      selectRange(nextCursor);
    },
    [currentSubmissionIds, selectRange, toggleSelection]
  );

  const currentFolders = useMemo(() => {
    const targetNest = getPathComponents(currentPath).length + 1;
    return currentCollectionPaths
      .filter(
        (p) =>
          pathContains(currentPath, p.path) &&
          getPathComponents(p.path).length === targetNest
      )
      .map((child) => ({
        name: getLastPathComponent(child.path),
        count: currentCollectionPaths.reduce((p, c) => {
          if (pathContains(child.path, c.path)) {
            return p + c.submissionIds.length;
          }
          return p;
        }, 0),
      }));
  }, [currentCollectionPaths, currentPath]);

  const canAddFolder = useMemo(
    () =>
      getPathComponents(currentPath).length < 5 && currentFolders.length < 10,
    [currentFolders.length, currentPath]
  );
  const handleClickFolder = useCallback(
    (folder: string) => {
      const nextPath = joinPath(currentPath, folder);
      navigatePath(nextPath);
    },
    [currentPath, navigatePath]
  );

  const { call: handleAddFolder } = useAsyncCallback(
    async (folder: string) => {
      const path = joinPath(currentPath, folder);
      const { collectionPath } = await AdminAPI.postAdminCollectionPath(
        currentCollection.id,
        { path }
      );
      setCurrentCollectionPaths((prev) => [...prev, collectionPath]);
    },
    [currentCollection.id, currentPath]
  );

  const { call: handleDropFolder } = useAsyncCallback(
    async (from: string, to: string) => {
      const fromPath = joinPath(currentPath, from);
      const toPath = joinPath(currentPath, to);
      const { collectionPaths } = await AdminAPI.postAdminCollectionPathReorder(
        currentCollection.id,
        {
          fromPath,
          toPath,
        }
      );
      setCurrentCollectionPaths(collectionPaths);
    },
    [currentCollection.id, currentPath]
  );
  const { call: handleDropFiles } = useAsyncCallback(
    async (from: DataTransfer, to: string) => {
      const submissionIds = from
        .getData("submissions")
        .split(" ") as SubmissionID[];
      if (!submissionIds[0]) {
        return;
      }
      const { collectionPaths } = await AdminAPI.putAdminSubmissionPaths(
        currentCollection.id,
        {
          path: joinPath(currentPath, to),
          submissionIds,
        }
      );
      setCursor(-1);
      setCurrentCollectionPaths(collectionPaths);
      setSelection(new Set());
    },
    [currentCollection.id, currentPath]
  );

  const handleCheckCusor = useCallback(() => {
    if (!cursorSubmission) {
      return;
    }
    toggleSelection(cursorSubmission.id);
  }, [cursorSubmission, toggleSelection]);

  const { call: handleDeletePath } = useAsyncCallback(
    async (path: string) => {
      if (
        !confirm(
          "このフォルダを削除します。ファイルは親フォルダに移動されます。削除しますか？"
        )
      ) {
        return;
      }
      const { collectionPaths } = await AdminAPI.deleteAdminCollectionPath(
        currentCollection.id,
        {
          path,
        }
      );

      setCurrentCollectionPaths(collectionPaths);
    },
    [currentCollection.id]
  );

  useEffect(() => {
    if (showMoveModal) {
      return;
    }
    containerRef.current?.focus({ preventScroll: true });
  }, [containerRef, showMoveModal, router.query.path, viewMode]);

  useEffect(() => {
    if (!currentPath) {
      return;
    }
    const matched = currentCollectionPaths.find((p) => p.path === currentPath);
    if (matched) {
      return;
    }
    const parentPath = getParentPath(currentPath);
    navigatePath(parentPath);
  }, [currentCollectionPaths, currentPath, navigatePath]);

  const handleSubmissionDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      const id = e.currentTarget.id;
      if (!id) {
        return;
      }
      const submissionId = id as SubmissionID;
      e.dataTransfer.setData("primary", submissionId);
      e.dataTransfer.setData(
        "submissions",
        selection.has(id as SubmissionID)
          ? Array.from(selection).join(" ")
          : submissionId
      );
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.dropEffect = "move";
    },
    [selection]
  );
  const handleSubmissionDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    },
    []
  );
  const { call: handleSubmissionDrop } = useAsyncCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      const toSubmission = e.currentTarget.id as SubmissionID;
      const primary = e.dataTransfer.getData("primary") as SubmissionID;
      const fromSubmissions = e.dataTransfer
        .getData("submissions")
        .split(" ") as SubmissionID[];

      const { collectionPath } = await AdminAPI.postAdminSubmissionReorder(
        currentCollection.id,
        {
          path: currentPath,
          primary,
          fromSubmissions,
          toSubmission,
        }
      );
      setCursor(-1);
      setCurrentCollectionPaths((paths) =>
        paths.map((path) =>
          path.id === collectionPath.id ? collectionPath : path
        )
      );
    },
    [currentCollection.id, currentPath]
  );

  const hint = useMemo(() => {
    if (selection.size) {
      const selectedAuthorId = Array.from(
        new Set(
          Array.from(selection).map((sid) => currentSubmissionMap[sid].authorId)
        )
      );
      return (
        selection.size.toLocaleString() +
        " 作品, " +
        selectedAuthorId.length +
        " 出展者 を選択中"
      );
    }
    const authorIds = Array.from(
      new Set(
        currentSubmissionIds.map((sid) => currentSubmissionMap[sid].authorId)
      )
    );
    return (
      currentSubmissionIds.length.toLocaleString() +
      " 作品, " +
      authorIds.length.toLocaleString() +
      " 出展者"
    );
  }, [currentSubmissionIds, currentSubmissionMap, selection]);

  const handleDownloadCsv = useCallback(() => {
    const ascSorted = currentSubmissions.sort(
      ({ timestamp: a }, { timestamp: b }) => a - b
    );
    const latestTimestamp = ascSorted[ascSorted.length - 1]?.timestamp ?? 0;
    const submissionIdPaths = currentCollectionPaths.reduce<
      Record<SubmissionID, string>
    >(
      (p, c) => ({
        ...p,
        ...c.submissionIds.reduce<Record<SubmissionID, string>>(
          (pp, cc) => ({ ...pp, [cc]: c.path }),
          {}
        ),
      }),
      {}
    );

    const source = ascSorted.map(
      ({ id, authorId, imageId, width, height, timestamp }, index) => {
        const author = authorIdMap[authorId];
        const authorName = author.name;
        return [
          index + 1,
          id,
          authorId,
          authorName,
          imageId,
          width,
          height,
          imageRejectStatus[imageId],
          submissionIdPaths[id] || "",
          format(timestamp, "yyyy/MM/dd HH:mm:ss"),
        ];
      }
    );
    const csv = stringify(source, {
      header: true,
      columns: [
        "#",
        "id",
        "authorId",
        "authorName",
        "imageId",
        "width",
        "height",
        "rejectStatus",
        "path",
        "timestamp",
      ],
      encoding: "ascii",
      quoted: true,
    });
    const buff = iconv.encode(csv, "Windows-31J");
    const blob = new Blob([buff], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const atag = document.createElement("a");
    atag.href = url;
    atag.target = "_blank";
    atag.download =
      "submissions-" + format(latestTimestamp, "yyyy-MM-dd_HH-mm-ss") + ".csv";
    atag.click();
  }, [
    authorIdMap,
    currentCollectionPaths,
    currentSubmissions,
    imageRejectStatus,
  ]);

  return (
    <>
      <Header label={["出展作品一覧"]} />
      <Main className="z-0 gap-4">
        <PageHeader>
          <BreadCrumb>
            <BreadCrumbLink href="/admin">{collection.name}</BreadCrumbLink>
            <BreadCrumbText>出展作品</BreadCrumbText>
          </BreadCrumb>
          <PageHeaderHint>
            {`全 ${currentSubmissions.length.toLocaleString()} 件`}
            <PageHeaderHintButton onClick={handleDownloadCsv}>
              <FontAwesomeIcon icon={faFileCsv} />
            </PageHeaderHintButton>
          </PageHeaderHint>
        </PageHeader>
        <PathBar
          hint={hint}
          selected={!!selection.size}
          path={currentPath}
          onClickPath={navigatePath}
          onBack={handleBack}
          onCancelSelect={cancelSelect}
          onDeletePath={currentPath ? handleDeletePath : undefined}
          onMoveSelection={openMoveModal}
          onSelectAll={
            selection.size === currentSubmissionIds.length
              ? undefined
              : selectAll
          }
        />
        <FolderList
          folders={currentFolders}
          canAddFolder={canAddFolder}
          onClickFolder={handleClickFolder}
          onAddFolder={handleAddFolder}
          onDropFolder={handleDropFolder}
          onDropOther={handleDropFiles}
        />
        <div
          ref={containerRef}
          className="flex flex-wrap justify-center gap-4 outline-none"
          style={{
            pointerEvents: viewMode ? "none" : "auto",
          }}
          onKeyDown={onKeyDown}
          tabIndex={1}
          onClick={handleContainerClick}
        >
          {currentSubmissionIds.map((id, index) => {
            const { imageId } = currentSubmissionMap[id];
            const selected = selection.has(id);
            return (
              <Selectable
                key={id}
                id={id}
                focus={index === cursor}
                selected={selected}
                scale
                draggable
                onCheck={handleClickCheck}
                onClick={handleClickSubmission}
                onDragStart={handleSubmissionDragStart}
                onDragOver={handleSubmissionDragOver}
                onDrop={handleSubmissionDrop}
              >
                <ImageCard
                  imageId={imageId}
                  thumbnailSize={200}
                  width={200}
                  height={200}
                  hint={rejectStatusToHint[imageRejectStatus[imageId]]}
                />
              </Selectable>
            );
          })}
          <EmptyImageCard count={5} width={200} />
        </div>
      </Main>
      <Preview
        image={viewMode ? cursorImage : undefined}
        author={selectedAuthor}
        selected={selection.has(cursorId)}
        onClose={closeView}
        onNext={navigateNext}
        onPrev={navigatePrev}
        onCheck={handleCheckCusor}
      />
      {showMoveModal && (
        <MoveModal
          count={selection.size}
          defaultPath={currentPath}
          paths={currentCollectionPaths}
          onMove={handleMove}
          onCancel={handleCancelMove}
        />
      )}
    </>
  );
}

export const getServerSideProps = userServerSideProps<Props>(
  "admin",
  async ({ params }) => {
    const collectionId = params?.collectionId as string;
    const [collection, submissions, authors, collectionPaths] =
      await Promise.all([
        CollectionModel.getCollection(collectionId),
        SubmissionModel.findSubmissionsByCollection(collectionId, {
          indexForward: false,
        }),
        AuthorModel.findAuthorsByCollection(collectionId),
        CollectionPathModel.findCollectionPathsByCollection(collectionId),
      ]);
    if (!collection) {
      return {
        notFound: true,
      };
    }
    return {
      props: {
        collection,
        submissions,
        authors,
        collectionPaths,
      },
    };
  }
);
