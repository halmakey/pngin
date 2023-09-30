import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3_notifications from "aws-cdk-lib/aws-s3-notifications";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import path from "path";

export class PnginInfraStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    env: "dev" | "prod",
    allowedOrigins: string[],
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const accountId = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    const isProd = env === "prod";
    const masterRemovalPolicy = isProd
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;
    const masterAutoDeleteObjects = !isProd;
    const masterDeletionProtection = isProd;

    const tableName = `pngin-table-${env}`;
    const exportCollectionQueueName = `pngin-export-collection-${env}`;
    const appUserName = `pngin-app-user-${env}`;
    const appPolicyName = `pngin-app-policy-${env}`;
    const lambdaRoleName = `pngin-lambda-role-${env}`;
    const appSecretName = `pngin-app-secret-${env}`;

    const table = new dynamodb.Table(this, "Table", {
      tableName,
      partitionKey: {
        name: "pkey",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: masterRemovalPolicy,
      deletionProtection: masterDeletionProtection,
    });
    table.addGlobalSecondaryIndex({
      indexName: "byModel",
      partitionKey: { name: "model", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byModelSequence",
      partitionKey: { name: "model", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sequence", type: dynamodb.AttributeType.NUMBER },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byType",
      partitionKey: { name: "type", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byTypeSequence",
      partitionKey: { name: "type", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sequence", type: dynamodb.AttributeType.NUMBER },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byCollection",
      partitionKey: {
        name: "pkeyByCollection",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byCollectionSequence",
      partitionKey: {
        name: "pkeyByCollection",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "sequence", type: dynamodb.AttributeType.NUMBER },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byAuthor",
      partitionKey: {
        name: "pkeyByAuthor",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byAuthorSequence",
      partitionKey: {
        name: "pkeyByAuthor",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "sequence", type: dynamodb.AttributeType.NUMBER },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byUser",
      partitionKey: {
        name: "pkeyByUser",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
    });
    table.addGlobalSecondaryIndex({
      indexName: "byDiscord",
      partitionKey: {
        name: "pkeyByDiscord",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
    });

    // buckets
    const imageBucket = new s3.Bucket(this, "ImageBucket", {
      cors: [
        {
          allowedMethods: [s3.HttpMethods.POST],
          allowedOrigins,
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: masterRemovalPolicy,
      autoDeleteObjects: masterAutoDeleteObjects,
    });

    const thumbnailBucket = new s3.Bucket(this, "ThumbnailBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const cacheBucket = new s3.Bucket(this, "CacheBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const exportBucket = new s3.Bucket(this, "ExportBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: masterRemovalPolicy,
      autoDeleteObjects: masterAutoDeleteObjects,
    });

    const imageOrigin = new origins.S3Origin(imageBucket);
    const imageDistribution = new cloudfront.Distribution(
      this,
      "ImageDistribution",
      {
        defaultBehavior: {
          origin: imageOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    const policy = new iam.Policy(this, "AppPolicy", {
      policyName: appPolicyName,
      statements: [
        new iam.PolicyStatement({
          sid: "AppPolicyDynamoDB",
          effect: iam.Effect.ALLOW,
          actions: [
            "dynamodb:BatchGetItem",
            "dynamodb:BatchWriteItem",
            "dynamodb:PutItem",
            "dynamodb:DeleteItem",
            "dynamodb:GetItem",
            "dynamodb:Query",
            "dynamodb:UpdateItem",
            "dynamodb:ConditionCheckItem",
          ],
          resources: [
            `arn:aws:dynamodb:${region}:${accountId}:table/${table.tableName}/index/*`,
            `arn:aws:dynamodb:${region}:${accountId}:table/${table.tableName}`,
          ],
        }),
        new iam.PolicyStatement({
          sid: "AppPolicyS3",
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:PutObject",
            "s3:GetObject",
            "s3:ListBucket",
            "s3:DeleteObject",
          ],
          resources: [
            `arn:aws:s3:::${imageBucket.bucketName}`,
            `arn:aws:s3:::${imageBucket.bucketName}/*`,
            `arn:aws:s3:::${thumbnailBucket.bucketName}`,
            `arn:aws:s3:::${thumbnailBucket.bucketName}/*`,
            `arn:aws:s3:::${exportBucket.bucketName}`,
            `arn:aws:s3:::${exportBucket.bucketName}/*`,
            `arn:aws:s3:::${cacheBucket.bucketName}`,
            `arn:aws:s3:::${cacheBucket.bucketName}/*`,
          ],
        }),
        new iam.PolicyStatement({
          sid: "AppPolicyCloudFront",
          effect: iam.Effect.ALLOW,
          actions: ["cloudfront:CreateInvalidation"],
          resources: [`arn:aws:cloudfront::${accountId}:distribution/*`],
        }),
        new iam.PolicyStatement({
          sid: "AppPolicySQS",
          effect: iam.Effect.ALLOW,
          actions: ["sqs:SendMessage"],
          resources: [
            `arn:aws:sqs:${region}:${accountId}:${exportCollectionQueueName}`,
          ],
        }),
      ],
    });

    const appUser = new iam.User(this, "AppUser", {
      userName: appUserName,
    });
    appUser.attachInlinePolicy(policy);
    const appAccessKey = new iam.AccessKey(this, "AppAccessKey", {
      user: appUser,
    });

    const executionLambdaRole = new iam.Role(this, "LambdaRole", {
      roleName: lambdaRoleName,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });
    executionLambdaRole.attachInlinePolicy(policy);

    const generateThumbnailFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "GenerateThumbnailFunction",
      {
        entry: path.join(__dirname, "./functions/generate-thumbnail/index.ts"),
        runtime: lambda.Runtime.NODEJS_18_X,
        role: executionLambdaRole,
        bundling: {
          nodeModules: ["sharp"],
          forceDockerBundling: true,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 1024,
        environment: {
          PNGIN_IMAGE_BUCKET_NAME: imageBucket.bucketName,
          PNGIN_THUMBNAIL_BUCKET_NAME: thumbnailBucket.bucketName,
        },
      }
    );
    const generateThumbnailDestination = new s3_notifications.LambdaDestination(
      generateThumbnailFunction
    );
    imageBucket.addObjectCreatedNotification(generateThumbnailDestination);
    imageBucket.addObjectRemovedNotification(generateThumbnailDestination);

    const thumbnailOrigin = new origins.S3Origin(thumbnailBucket);
    const thumbnailDistribution = new cloudfront.Distribution(
      this,
      "ThumbnailDistribution",
      {
        defaultBehavior: {
          origin: thumbnailOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    const exportOrigin = new origins.S3Origin(exportBucket);
    const exportDistribution = new cloudfront.Distribution(
      this,
      "ExportDistribution",
      {
        defaultBehavior: {
          origin: exportOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    const exportCollectionQueue = new sqs.Queue(this, "ExportCollectionQueue", {
      queueName: exportCollectionQueueName,
      visibilityTimeout: cdk.Duration.minutes(15 * 6),
    });

    const exportCollectionFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "ExportCollectionFunction",
      {
        entry: path.join(__dirname, "./functions/export-collection/index.ts"),
        runtime: lambda.Runtime.NODEJS_18_X,
        role: executionLambdaRole,
        bundling: {
          nodeModules: ["ffmpeg-static", "sharp"],
          forceDockerBundling: true,
        },
        timeout: cdk.Duration.minutes(15),
        memorySize: 3008,
        ephemeralStorageSize: cdk.Size.gibibytes(4),
        environment: {
          PNGIN_TABLE_NAME: table.tableName,
          PNGIN_EXPORT_DISTRIBUTION_ID: exportDistribution.distributionId,
          PNGIN_IMAGE_BUCKET_NAME: imageBucket.bucketName,
          PNGIN_EXPORT_BUCKET_NAME: exportBucket.bucketName,
          PNGIN_CACHE_BUCKET_NAME: cacheBucket.bucketName,
        },
      }
    );
    const exportCollectionEventSource = new lambdaEventSources.SqsEventSource(
      exportCollectionQueue,
      {
        batchSize: 1,
      }
    );
    exportCollectionFunction.addEventSource(exportCollectionEventSource);

    new sm.Secret(this, "AppSecret", {
      secretName: appSecretName,
      secretObjectValue: {
        region: cdk.SecretValue.unsafePlainText(region),
        accessKeyId: cdk.SecretValue.unsafePlainText(
          appAccessKey.accessKeyId
        ),
        secretAccessKey: appAccessKey.secretAccessKey,
        imageOrigin: cdk.SecretValue.unsafePlainText(
          "https://" + imageDistribution.domainName
        ),
        thumbnailOrigin: cdk.SecretValue.unsafePlainText(
          "https://" + thumbnailDistribution.domainName
        ),
        exportOrigin: cdk.SecretValue.unsafePlainText(
          "https://" + exportDistribution.domainName
        ),
        exportDistributionId: cdk.SecretValue.unsafePlainText(
          exportDistribution.distributionId
        ),
        exportSqsUrl: cdk.SecretValue.unsafePlainText(
          exportCollectionQueue.queueUrl
        ),
        imageBucketName: cdk.SecretValue.unsafePlainText(
          imageBucket.bucketName
        ),
        thumbnailBucketName: cdk.SecretValue.unsafePlainText(
          thumbnailBucket.bucketName
        ),
        exportBucketName: cdk.SecretValue.unsafePlainText(
          exportBucket.bucketName
        ),
        cacheBucketName: cdk.SecretValue.unsafePlainText(
          cacheBucket.bucketName
        ),
        tableName: cdk.SecretValue.unsafePlainText(table.tableName),
      },
    });
  }
}
