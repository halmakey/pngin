import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <meta name="description" content="PNG Museum" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="robots" content="noindex" />
      </Head>
      <body className="bg-gray-800">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
