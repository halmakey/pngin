#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PnginInfraStack } from "./pngin-infra-stack";
import { PnginInfraCommonStack } from "./pngin-infra-common-stack";
import { DEV_ORIGINS, PROD_ORIGINS } from "@/constants/origin";

const app = new cdk.App();

new PnginInfraCommonStack(app, "PnginInfraCommonStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new PnginInfraStack(app, "PnginInfraStackDev", "dev", DEV_ORIGINS, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new PnginInfraStack(app, "PnginInfraStackProd", "prod", PROD_ORIGINS, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
