import {
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export async function getSecrets<SecretKeys extends string>(
  secretId: string,
  secretKeys: SecretKeys[]
): Promise<Record<SecretKeys, string | undefined>> {
  const client = new SecretsManagerClient({});
  const result = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    })
  );
  const secrets = JSON.parse(result.SecretString!);
  let values = {} as Record<SecretKeys, string | undefined>;
  for (const key of secretKeys) {
    values[key] = secrets[key];
  }
  return values;
}

export async function putSecrets(
  secretId: string,
  secrets: Record<string, string>
) {
  const client = new SecretsManagerClient({});
  const result = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    })
  );
  const prevSecrets = JSON.parse(result.SecretString!);
  const nextSecrets = { ...prevSecrets, ...secrets };

  await client.send(
    new PutSecretValueCommand({
      SecretId: secretId,
      SecretString: JSON.stringify(nextSecrets),
    })
  );
}
