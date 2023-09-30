import Header from "@/components/Header";
import Main from "@/components/Main";
import ImageCard, { EmptyImageCard } from "@/components/admin/image/ImageCard";
import BreadCrumb from "@/components/admin/breadcrumb/BreadCrumb";
import BreadCrumbLink from "@/components/admin/breadcrumb/BreadCrumbLink";
import BreadCrumbText from "@/components/admin/breadcrumb/BreadCrumbText";
import { AuthorModel, CollectionModel, RejectModel } from "@/models";
import {
  Author,
  AuthorID,
  Collection,
  Reject,
  RejectStatus,
} from "@/types/model";
import { userServerSideProps } from "@/utils/ssr/server-side-props";
import OverlayLink from "@/components/admin/image/OverlayLink";
import { useCallback, useMemo } from "react";
import PageHeader from "@/components/admin/page-header/PageHeader";
import PageHeaderHint from "@/components/admin/page-header/PageHeaderHint";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv } from "@fortawesome/free-solid-svg-icons";
import PageHeaderHintButton from "@/components/admin/page-header/PageHeaderHintButton";
import { stringify } from "csv-stringify/sync";
import { format } from "date-fns";
import iconv from "iconv-lite";

interface Props {
  collection: Collection;
  authors: Author[];
  rejects: Reject[];
}

const rejectStatusToHint = {
  reject: "alert",
  review: "info",
} as const;

export default function ImageCollection({
  collection,
  authors,
  rejects,
}: Props) {
  const rejectStatusMap = useMemo(
    () =>
      rejects.reduce(
        (p, c) => ({
          ...p,
          [c.authorId]: c.status,
        }),
        {} as Record<AuthorID, RejectStatus>
      ),
    [rejects]
  );

  const handleDownloadCsv = useCallback(() => {
    const ascSorted = authors.sort(
      ({ timestamp: a }, { timestamp: b }) => a - b
    );
    const latestTimestamp = ascSorted[ascSorted.length - 1]?.timestamp ?? 0;
    const source = ascSorted.map(({ id, name, imageId, timestamp }, index) => {
      return [
        index + 1,
        id,
        name,
        imageId,
        rejectStatusMap[id],
        format(timestamp, "yyyy/MM/dd HH:mm:ss"),
      ];
    });
    const csv = stringify(source, {
      header: true,
      columns: ["#", "id", "name", "imageId", "rejectStatus", "timestamp"],
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
      "authors-" + format(latestTimestamp, "yyyy-MM-dd_HH-mm-ss") + ".csv";
    atag.click();
  }, [authors, rejectStatusMap]);

  return (
    <>
      <Header label={["出展者一覧"]} />
      <Main className="flex flex-col gap-8">
        <PageHeader>
          <BreadCrumb>
            <BreadCrumbLink href="/admin">{collection.name}</BreadCrumbLink>
            <BreadCrumbText>出展者</BreadCrumbText>
          </BreadCrumb>
          <PageHeaderHint>
            {`全 ${authors.length.toLocaleString()} 件`}
            <PageHeaderHintButton onClick={handleDownloadCsv}>
              <FontAwesomeIcon icon={faFileCsv} />
            </PageHeaderHintButton>
          </PageHeaderHint>
        </PageHeader>
        <div className="mx-auto flex flex-wrap items-center justify-center gap-4">
          {authors.map((author) => (
            <OverlayLink
              key={author.id}
              label={author.name}
              href={{
                pathname: "/admin/collection/[collectionId]/author/[authorId]",
                query: {
                  collectionId: author.collectionId,
                  authorId: author.id,
                },
              }}
            >
              <ImageCard
                imageId={author.imageId}
                thumbnailSize={300}
                width={210}
                height={120}
                hint={rejectStatusToHint[rejectStatusMap[author.id]]}
              />
            </OverlayLink>
          ))}
          <EmptyImageCard count={5} width={210} />
        </div>
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

    const [authors, rejects] = await Promise.all([
      AuthorModel.findAuthorsByCollection(collectionId, {
        indexForward: false,
      }),
      RejectModel.findRejectsByCollection(collectionId),
    ]);
    return {
      props: {
        collection,
        authors,
        rejects,
      },
    };
  }
);
