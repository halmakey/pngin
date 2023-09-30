import { SQSHandler } from "aws-lambda";
import { encode } from "./video";
import os from "os";
import {
  AuthorModel,
  CollectionModel,
  CollectionPathModel,
  ExportRequestModel,
  ExportResultModel,
  SubmissionModel,
} from "@/models";
import { CollectionPath } from "@/models/CollectionPathModel";
import { pathContains } from "@/utils/path-utils";
import { mkdirp } from "mkdirp";
import path from "path";
import { chdir } from "process";
import { Submission, SubmissionID } from "@/models/SubmissionModel";
import { Author, AuthorID } from "@/models/AuthorModel";
import { rimraf } from "rimraf";
import { createTransactWrite } from "@/models/dynamodb";
import { createReadStream } from "fs";
import { ExportResult } from "@/models/ExportResultModel";
import { invalidateCache } from "./invalidation";
import { createTile, prepareImages } from "./image";
import { writeFile } from "fs/promises";
import { getExportBucket } from "./bucket";

// S3上のmp4とjsonを書き換えないテスト実行モード
const DRY_RUN = false;

// 出展作品情報
interface ExportSubmissionRecord {
  id: string; // SubmissionID
  path: string; // 配置フォルダ
  imageId: string; // ImageID
  width: number; // 横幅 1920 | 1080
  height: number; // 高さ 1920 | 1080
  sequence: number; // 動画上の配置順序 0オリジン
  author: ExportAuthorRecord; // 出展者情報
}

// 出展者情報
interface ExportAuthorRecord {
  id: string; // AuthorID
  name: string; // 出展者名
  imageId: string; // ImageID
  width: number; // 横幅 700
  height: number; // 高さ 400
  sequence: number; // 動画上の配置順序 0オリジン
}

// エクスポート情報
interface ExportRecord {
  exportId: string; // ExportID
  path: string; // 基準パス
  timestamp: number; // 更新日時
  submissions: ExportSubmissionRecord[]; // 基準パス以下のすべての作品
  authors: ExportAuthorRecord[]; // 基準パス以下の作品の出展者
  authorPage: number; // authorが始まる動画ページ(秒)数
}

const SUBMISSION_COUNT_PER_PAGE = 6 * 6;
const AUTHOR_COUNT_PER_PAGE = 8 * 14;

export const handler: SQSHandler = async (event, context) => {
  for (const record of event.Records) {
    if (Number(record.attributes.ApproximateReceiveCount) > 1) {
      continue;
    }
    const exportId = record.body;
    await exportCollections(exportId);
  }
};
const root = path.join(os.tmpdir(), "export-collection");

async function exportCollections(exportId: string) {
  const request = await ExportRequestModel.getExportRequest(exportId);
  if (!request) {
    throw new Error("Unexpected exportId: " + exportId);
  }

  const { collectionId } = request;
  const result = ExportResultModel.createExportResult(request.id, {
    collectionId,
    paths: [],
    startTime: Date.now(),
    status: "process",
  });

  try {
    await createTransactWrite().put(result).write();

    await mkdirp(root);

    chdir(root);
    console.log(root);

    const imagesDir = path.join(root, "images");
    await mkdirp(imagesDir);

    const [collection, collectionPaths, submissions, authors] =
      await Promise.all([
        CollectionModel.getCollection(collectionId),
        CollectionPathModel.findCollectionPathsByCollection(collectionId),
        SubmissionModel.findSubmissionsByCollection(collectionId),
        AuthorModel.findAuthorsByCollection(collectionId),
      ]);
    if (!collection) {
      throw new Error("Unexpected collelction: " + collectionId);
    }

    // Skip root path
    const targetCollectionPaths = collectionPaths.filter((cp) => cp.path);
    const submissionMap = submissions.reduce<Record<SubmissionID, Submission>>(
      (p, c) => ({ ...p, [c.id]: c }),
      {}
    );
    const authorMap = authors.reduce<Record<AuthorID, Author>>(
      (p, c) => ({ ...p, [c.id]: c }),
      {}
    );

    // Export all of targetCollectionPaths
    for (const collectionPath of targetCollectionPaths) {
      await rimraf([root, "output"].join("/"));

      const targetPaths: CollectionPath[] = [
        collectionPath,
        ...collectionPaths.filter(
          (cp) =>
            cp.path !== collectionPath.path &&
            pathContains(collectionPath.path, cp.path)
        ),
      ];
      await exportCollectionPath(
        exportId,
        targetPaths,
        submissionMap,
        authorMap,
        result
      );
    }

    result.status = "complete";
    result.timestamp = result.endTime = Date.now();
    await createTransactWrite().put(result).write();
  } catch (err) {
    result.endTime = Date.now();
    result.status = "error";
    result.message = String(err);
    result.timestamp = Date.now();
    await createTransactWrite()
      .put(result)
      .write()
      .catch(() => {});
    throw err;
  } finally {
    if (DRY_RUN) {
      await createTransactWrite()
        .delete(request.pkey)
        .delete(result.pkey)
        .write();
    }
  }
}

async function exportCollectionPath(
  exportId: string,
  collectionPaths: CollectionPath[],
  submissionMap: Record<SubmissionID, Submission>,
  authorMap: Record<AuthorID, Author>,
  result: ExportResult
) {
  const exportBucket = getExportBucket();
  const collectionPath = collectionPaths[0];
  if (!collectionPath) {
    return;
  }

  const { collectionId } = collectionPath;
  let exportSubmissions = collectionPaths.reduce<ExportSubmissionRecord[]>(
    (p, c) => [
      ...p,
      ...c.submissionIds.map<ExportSubmissionRecord>((id, i) => {
        const { imageId, width, height, authorId } = submissionMap[id];
        const author = authorMap[authorId];
        return {
          id,
          path: c.path,
          imageId,
          width,
          height,
          sequence: p.length + i,
          author: {
            id: author.id,
            // Set values after
          } as ExportAuthorRecord,
        };
      }),
    ],
    []
  );
  const exportAuthorIds = Array.from(
    new Set(exportSubmissions.map((s) => s.author.id))
  ) as AuthorID[];
  const exportAuthors = exportAuthorIds.map<ExportAuthorRecord>(
    (id, sequence) => {
      const author = authorMap[id];
      return {
        id,
        imageId: author.imageId,
        name: author.name,
        width: 700,
        height: 400,
        sequence,
      };
    }
  );
  exportSubmissions = exportSubmissions.map((s) => {
    const index = exportAuthorIds.indexOf(s.author.id as AuthorID);
    return { ...s, author: exportAuthors[index] };
  });

  const exportSubmissionImageIds = exportSubmissions.map((es) => es.imageId);
  const exportAuthorImageIds = exportAuthors.map((ea) => ea.imageId);
  if (exportSubmissionImageIds.length === 0 || exportAuthorIds.length === 0) {
    return;
  }

  const submissionPageCount = Math.ceil(
    exportSubmissionImageIds.length / SUBMISSION_COUNT_PER_PAGE
  );
  const authorPageCount = Math.ceil(
    exportAuthorIds.length / AUTHOR_COUNT_PER_PAGE
  );

  const exportRecord: ExportRecord = {
    exportId,
    path: collectionPath.path,
    timestamp: Date.now(),
    submissions: exportSubmissions,
    authors: exportAuthors,
    authorPage: submissionPageCount,
  };

  const exportJson = JSON.stringify(exportRecord, undefined, 2);

  // output
  const exportDir = path.join(root, "output", exportId);
  const exportPathDir = path.join(exportDir, collectionPath.path);
  const exportKeyPrefix = path.join(
    "collection",
    collectionId,
    collectionPath.path
  );

  await mkdirp(exportPathDir);

  chdir(exportPathDir);
  console.log(exportPathDir);

  const outVideoFile = "output.mp4";

  for (let frame = 0; frame < submissionPageCount; frame++) {
    const imageIds = exportSubmissionImageIds.slice(
      SUBMISSION_COUNT_PER_PAGE * frame,
      SUBMISSION_COUNT_PER_PAGE * frame + SUBMISSION_COUNT_PER_PAGE
    );
    const inputs = await prepareImages(root, imageIds, 720, 720);

    await createTile({
      inputs,
      totalWidth: 4320,
      totalHeight: 4320,
      tileWidth: 720,
      tileHeight: 720,
      output: frame.toString().padStart(4, "0") + ".tiff",
    });
  }

  for (let frame = 0; frame < authorPageCount; frame++) {
    const imageIds = exportAuthorImageIds.slice(
      AUTHOR_COUNT_PER_PAGE * frame,
      AUTHOR_COUNT_PER_PAGE * frame + AUTHOR_COUNT_PER_PAGE
    );

    const inputs = await prepareImages(root, imageIds, 540, 308);

    await createTile({
      inputs,
      totalWidth: 4320,
      totalHeight: 4320,
      tileWidth: 540,
      tileHeight: 308,
      output:
        (submissionPageCount + frame).toString().padStart(4, "0") + ".tiff",
    });
  }
  await encode("%04d.tiff", outVideoFile);

  if (DRY_RUN) {
    await writeFile("output.json", Buffer.from(exportJson));
    return;
  }

  const readStream = createReadStream("output.mp4");

  const exportLatestVideoKey = path.join(exportKeyPrefix, "latest.mp4");
  const exportLatestJsonKey = path.join(exportKeyPrefix, "latest.json");

  await exportBucket.putObject(exportLatestVideoKey, readStream, "video/mp4");
  await exportBucket.putObject(
    exportLatestJsonKey,
    Buffer.from(exportJson),
    "application/json"
  );

  await invalidateCache("/" + exportLatestVideoKey, "/" + exportLatestJsonKey);

  result.paths = [...result.paths, collectionPath.path];
  result.status = "process";
  result.timestamp = Date.now();
  await createTransactWrite().put(result).write();
}
