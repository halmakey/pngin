import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  GetObjectCommand,
  NotFound,
  CopyObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { ReadStream } from "fs";

export type S3AppClient = ReturnType<typeof createS3AppClient>;

export function createS3AppClient({
  region,
  accessKeyId,
  secretAccessKey,
  bucketName,
}: {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName: string;
}) {
  const client = new S3Client(
    region && accessKeyId && secretAccessKey
      ? {
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        }
      : {}
  );

  return {
    get bucketName() {
      return bucketName;
    },
    async generateSignedPostUrl(
      key: string,
      contentType: string,
      maxContentLength: number
    ) {
      const result = await createPresignedPost(client, {
        Bucket: bucketName,
        Key: key,
        Conditions: [["content-length-range", 0, maxContentLength]],
        Fields: {
          "Content-Type": contentType,
        },
      });
      return result;
    },
    async putObject(
      key: string,
      body: Buffer | ReadStream,
      contentType: string
    ) {
      const result = await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
      return result;
    },
    async listObjects({
      prefix,
      delimiter,
    }: {
      prefix?: string;
      delimiter?: string;
    } = {}) {
      let next: string | undefined = undefined;
      let objects: ListObjectsV2CommandOutput["Contents"] = [];
      do {
        const result: ListObjectsV2CommandOutput = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Delimiter: delimiter,
            Prefix: prefix,
            ContinuationToken: next,
          })
        );
        if (result.Contents) {
          objects = [...objects, ...result.Contents];
        }
        next = result.NextContinuationToken;
      } while (next);
      return objects;
    },
    async headObject(key: string): Promise<HeadObjectCommandOutput | null> {
      return await client
        .send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )
        .catch((err) => {
          if (err instanceof NotFound) {
            return null;
          }
          if (err instanceof NoSuchKey) {
            return null;
          }
          throw err;
        });
    },
    async deleteObject(key: string) {
      return await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
    },
    async getObject(key: string) {
      return await client
        .send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )
        .catch((err) => {
          if (err instanceof NotFound) {
            return null;
          }
          if (err instanceof NoSuchKey) {
            return null;
          }
          throw err;
        });
    },
    async copy(from: string, to: string) {
      const copySource =
        "/" +
        [
          encodeURIComponent(bucketName),
          ...from.split("/").map((comp) => encodeURIComponent(comp)),
        ].join("/");
      return await client.send(
        new CopyObjectCommand({
          Bucket: bucketName,
          Key: to,
          CopySource: copySource,
        })
      );
    },
  };
}

export function getObjectName(imageId: string) {
  return imageId + ".png";
}
