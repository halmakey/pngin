import { User } from "@/types/model";
import { userServerSideProps } from "@/utils/ssr/server-side-props";

interface Props {
  users: User[];
}

export default function Page({ users }: Props) {
  return <pre>ユーザーの一覧を表示するページ</pre>;
}

export const getServerSideProps = userServerSideProps<Props>(
  "admin",
  async () => {
    return {
      notFound: true,
    };
  }
);
