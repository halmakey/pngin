import Header from "@/components/Header";
import Main from "@/components/Main";
import { Collection } from "@/types/model";
import Image from "next/image";
import Link from "next/link";
interface Props {
  collection: Collection[];
}

export default function Page({ collection }: Props) {
  return (
    <>
      <Header label="エラー" />
      <Main>
        <div className="mx-auto mt-60 flex flex-col items-center">
          <span className="text-[200px] font-extrabold leading-[200px] text-gray-800">
            404
          </span>
          <span className="text-[70px] font-extrabold leading-[70px] text-gray-500">
            NOT FOUND
          </span>
          <Link href="/" className="btn-fill mt-12 !no-underline">
            トップへ戻る
          </Link>
        </div>
      </Main>
    </>
  );
}
