import { AppProps } from "next/app";
import "@/styles/globals.css";
import Head from "next/head";
import { AuthProvider } from "@/contexts/auth-context";
import { User } from "@/types/model";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

export default function App({ Component, pageProps }: AppProps) {
  const user: User =
    typeof pageProps?.user === "object" ? pageProps.user : undefined;
  return (
    <>
      <Head>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="description" content="PNG Museum" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider initialUser={user}>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}
