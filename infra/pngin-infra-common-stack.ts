import * as cdk from "aws-cdk-lib";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class PnginInfraCommonStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    new sm.Secret(this, "ExternalSecrets", {
      secretName: "pngin-external-secrets",
      secretObjectValue: {},
    });

    new sm.Secret(this, "SessionSecrets", {
      secretName: "pngin-session-secrets",
      secretObjectValue: {}
    })
  }
}
