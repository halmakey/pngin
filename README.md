# PNGin System

画像投稿配信システム

## 環境

- Node.js
- Yarn
- Next.js
- AWS CLI
- AWS CDK
- Docker (AWS CDK から使用)

## セットアップ

PNGin を動作させるためには、次のセットアップが必要です。

- Yarn インストール
- AWS CDK デプロイ
- セッション用シークレット
- Discord アカウント認証設定
- reCAPTCHA 設定
- 環境変数
- Vercel にデプロイ
- 本番運用ドメインとアプリケーション名の設定

### Yarn インストール

Yarnを使用して依存モジュールをインストールしてください。

```sh

yarn install

```

### AWS CDK デプロイ

PNGin は多くの機能を AWS に依存しています。

AWS CDK を使用して AWS 上のリソースを構築してください。

参考:
https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/work-with.html#work-with-prerequisites

```sh
# AWSアカウントを作成し、AWS CLIで認証する

aws configure

# CDKをグローバル環境にインストールする

npm install -g typescript
npm install -g aws-cdk

# 初回のみAWSアカウントに CDKToolkit をセットアップする
# 実行前にDockerを起動しておく
cdk bootstrap

# AWS上にリソースを構築する
# デプロイしてよいか（開発環境、本番環境で）確認されるので都度yキーで進める
# ※初回デプロイには時間がかかる
cdk deploy --all
```


### セッション用シークレット

セッションを扱うためのキーペアを準備します。
次のコマンドでAWS Secrets Managerに鍵ペアを生成して設定します。

```sh
yarn configure-session-secrets
```

### Discord OAuth2 アカウント認証設定

PNGin では認証に Discord アカウントを使用します。

Discord アカウントによる連携ログインを有効化するために、Discord Developer Portal から Application を追加し、OAuth2 の設定画面から `CLIENT ID` と `CLIENT SECRET` を取得し、 次のコマンドでSecretManagerに値を設定してください。

```sh
yarn configure-discord-oauth2
✔ Discord Client ID: … 12345
✔ Discord Client Secret: … ******
Putting discord secrets to pngin-app-secret-dev
Putting discord secrets to pngin-app-secret-prod
```

また、Redirects に次のコールバック URL を追加してください。

```
http://localhost:3000/api/auth/callback
```

追加したら Save Changes ボタンで設定を反映してください。

### reCAPTCHA 設定

PNGin は画像投稿フォームで reCAPTCHA による不正検出を行います。

[reCAPTCHA デベロッパーガイド](https://developers.google.com/recaptcha/intro?hl=ja) を参考に、reCAPTCHA にて次の設定でサイトを追加します。

- ラベル: 任意 （例: pngin）
- reCAPTCHA タイプ: スコアベース（v3）
- ドメイン: 本番運用予定のドメイン名と `localhost` を追加

サイトを追加したら、サイトキーとシークレットキーを取得し、次のコマンドでSecretManagerに値を設定してください。

```sh
yarn configure-recaptcha
✔ reCAPTCHA v3 Site Key: … aaaddd
✔ reCAPTCHA v3 Secret Key: … ******
Putting discord secrets to pngin-app-secret-dev
Putting discord secrets to pngin-app-secret-prod
```

### 環境変数

ここまでの設定をすべて `.env.local` に反映します。
反映するには次のスクリプトを実行してください。

```sh
yarn setup-env-dev
```

### Vercel にデプロイ

＜手順整理中＞

### 本番運用ドメインとアプリケーション名の設定

＜手順整理中＞

## インフラ環境の削除

`cdk destroy --all` でCDKによってAWSにデプロイされたリソースを削除できます。

本番環境のデータを保全するため、次のリソースについては手動で削除する必要があります。

- DynamoDBテーブル `pngin-table-prod`
- S3バケット `pngininfrastackprod-exportbucket-*`
- S3バケット `pngininfrastackprod-imagebucket-*`

