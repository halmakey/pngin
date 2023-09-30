import Header from "@/components/Header";
import Main from "@/components/Main";
import { useAsyncCallback } from "@/hooks/useAsyncCallback";
import {
  CollectionModel,
  ExportRequestModel,
  ExportResultModel,
} from "@/models";
import { Collection, ExportRequest, ExportResult } from "@/types/model";
import { userServerSideProps } from "@/utils/ssr/server-side-props";
import { useEffect, useMemo, useState } from "react";
import { AdminAPI } from "@/utils/api";
import { ExportHistoryLine } from "@/components/admin/export/ExportHistoryLine";
import { ExportFolderCard } from "@/components/admin/export/ExportFolderCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport } from "@fortawesome/free-solid-svg-icons";
import BreadCrumb from "@/components/admin/breadcrumb/BreadCrumb";
import BreadCrumbLink from "@/components/admin/breadcrumb/BreadCrumbLink";
import BreadCrumbText from "@/components/admin/breadcrumb/BreadCrumbText";
import PageHeader from "@/components/admin/page-header/PageHeader";

interface Props {
  collection: Collection;
  requests: ExportRequest[];
  results: ExportResult[];
}

export default function CollectionPage({
  collection,
  requests,
  results,
}: Props) {
  const [currentRequests, setCurrentRequests] = useState(requests);
  const [currentResults, setCurrentResults] = useState(results);
  const resultMap = useMemo(
    () =>
      currentResults.reduce<Record<string, ExportResult>>(
        (p, c) => ({ ...p, [c.id]: c }),
        {}
      ),
    [currentResults]
  );

  const items = useMemo(() => {
    const firstUrls = new Set<string>();
    return currentRequests.map((req) => {
      const res = resultMap[req.id];
      const exportStatus = AdminAPI.getExportStatus(req, res);
      const pathUrls = res
        ? AdminAPI.getExportPublicUrls(res).filter(({ json }) => {
            const contains = firstUrls.has(json);
            if (contains) {
              return false;
            }
            firstUrls.add(json);
            return true;
          })
        : [];

      return { req, res, exportStatus, pathUrls };
    });
  }, [currentRequests, resultMap]);

  const busy = useMemo(
    () =>
      items.reduce(
        (p, { exportStatus }) =>
          p || exportStatus === "queue" || exportStatus === "progress",
        false
      ),
    [items]
  );

  useEffect(() => {
    const handle = setInterval(
      async () => {
        const { exportRequests, exportResults } =
          await AdminAPI.getAdminExports(collection.id);
        setCurrentRequests(exportRequests);
        setCurrentResults(exportResults);
      },
      busy ? 2000 : 10000
    );
    return () => {
      clearInterval(handle);
    };
  }, [busy, collection.id]);

  const { call: handleRequestClick, pending: pendingRequest } =
    useAsyncCallback(async () => {
      try {
        if (
          !confirm(
            "エクスポートを開始します。\n\nエクスポート処理はバックグラウンドで行われます。\n処理時間が15分を超える場合はタイムアウトします。\n\nよろしいですか？"
          )
        ) {
          return;
        }
        const { exportRequest } = await AdminAPI.postAdminExportRequest(
          collection.id
        );
        setCurrentRequests((reqs) => [exportRequest, ...reqs]);
      } catch (err) {
        alert("エラー: " + String(err));
      }
    }, [collection.id]);

  return (
    <>
      <Header label={["エクスポート"]} />
      <Main className="flex flex-col gap-8">
        <PageHeader>
          <BreadCrumb>
            <BreadCrumbLink href="/admin">{collection.name}</BreadCrumbLink>
            <BreadCrumbText>エクスポート</BreadCrumbText>
          </BreadCrumb>
        </PageHeader>
        <div className="flex items-center justify-start gap-4">
          <button
            className="btn-fill"
            type="button"
            onClick={handleRequestClick}
            disabled={pendingRequest || busy}
          >
            <FontAwesomeIcon width={16} icon={faFileExport} />
            エクスポートを開始する
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {items.map(({ req, res, exportStatus, pathUrls }) => {
            return (
              <div key={req.id} className="flex w-full flex-col gap-4">
                <ExportHistoryLine
                  exportId={req.id}
                  timestamp={req.timestamp}
                  exportStatus={exportStatus}
                  message={res?.message}
                />
                {!!pathUrls?.length && (
                  <div className="ml-6 mb-6 flex flex-1 flex-wrap gap-2 font-mono">
                    {pathUrls.map(({ path, json, video }) => (
                      <ExportFolderCard
                        key={path}
                        path={path}
                        json={json}
                        video={video}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
    const [requests, results] = await Promise.all([
      ExportRequestModel.findExportRequestsByCollection(collectionId),
      ExportResultModel.findExportResultsByCollection(collectionId),
    ]);
    return {
      props: {
        collection,
        requests,
        results,
      },
    };
  }
);
