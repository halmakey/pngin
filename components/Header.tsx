import AuthContext from "@/contexts/auth-context";
import Popup from "@/layouts/Popup";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useContext, useMemo, useState } from "react";
import Logo from "./assets/Logo";
import Avatar from "./Avatar";
import { SITE_TITLE } from "@/constants/app";
import Head from "next/head";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDoorOpen,
  faLandmark,
  faLock,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import useMyCollections from "@/hooks/useMyCollections";

export default function Header({ label }: { label?: string | string[] }) {
  const router = useRouter();
  const [popup, setPopup] = useState<"none" | "user">("none");
  const hidePopup = useCallback(() => {
    setPopup("none");
  }, []);
  const showUser = useCallback(() => {
    setPopup("user");
  }, []);
  const { pending, user } = useContext(AuthContext);
  const title = useMemo(() => {
    let comps = Array.isArray(label) ? label : [label];
    if (comps.length === 0 || !comps[0]) {
      return SITE_TITLE;
    }
    return [SITE_TITLE, ...comps].join(" | ");
  }, [label]);
  const { data } = useMyCollections();
  const collections = useMemo(() => data?.collections ?? [], [data]);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <header className="z-20 h-14 bg-gray-800 text-white">
        <div className="container mx-auto flex h-full flex-row items-center px-8">
          <div className="flex flex-1 flex-row">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex-1" />
          </div>
          <div className="flex flex-row items-center">
            {pending ? null : user ? (
              <div className="flex flex-row items-center gap-4">
                <Avatar
                  src={user.avatarUrl}
                  width={40}
                  height={40}
                  alt={user.name}
                  onClick={showUser}
                />
              </div>
            ) : (
              <Link
                href={`/api/auth/signin?callback=${router.asPath}`}
                prefetch={false}
              >
                <button className="btn-opacity fill-white text-white">
                  <FontAwesomeIcon icon={faUser} />
                  ログイン
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>
      {user && (
        <Popup show={popup !== "none"} onDismiss={hidePopup}>
          <div className="max-w-[240px] p-4 px-5">
            <div className="flex flex-col items-start gap-4">
              <div className="w-full self-stretch border-b-2 border-gray-400 pb-4 text-center text-xs font-bold text-gray-200">
                {user.name}
              </div>
              {!!collections.length &&
                collections.map((collection) => {
                  return (
                    <Link
                      key={collection.id}
                      href={`/submission/${collection.id}`}
                      className="text-white"
                    >
                      <button className="btn-opacity">
                        <FontAwesomeIcon width={16} icon={faLandmark} />
                        {collection.name}
                      </button>
                    </Link>
                  );
                })}
              {user?.role === "admin" && (
                <Link href="/admin" className="text-white">
                  <button
                    className="btn-opacity"
                    disabled={router.pathname === "/admin"}
                  >
                    <FontAwesomeIcon width={16} icon={faLock} />
                    管理画面
                  </button>
                </Link>
              )}
              <Link
                href="/api/auth/signout"
                prefetch={false}
                onClick={hidePopup}
                className="text-white"
              >
                <button className="btn-opacity">
                  <FontAwesomeIcon width={16} icon={faDoorOpen} />
                  ログアウト
                </button>
              </Link>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}
