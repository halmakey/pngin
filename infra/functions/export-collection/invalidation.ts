import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

export async function invalidateCache(...paths: string[]) {
  const client = new CloudFrontClient({});
  const distributionId = process.env.PNGIN_EXPORT_DISTRIBUTION_ID!;
  await client.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    })
  );
}
