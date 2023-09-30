import BreadCrumb from "@/components/admin/breadcrumb/BreadCrumb";
import BreadCrumbText from "@/components/admin/breadcrumb/BreadCrumbText";
import CollectionCard, {
  EmptyCollectionCard,
} from "@/components/admin/CollectionCard";
import PageHeader from "@/components/admin/page-header/PageHeader";
import Header from "@/components/Header";
import Main from "@/components/Main";
import { CollectionModel } from "@/models";
import { Collection } from "@/types/model";

import { userServerSideProps } from "@/utils/ssr/server-side-props";

interface Props {
  collections: Collection[];
}

export default function Page({ collections }: Props) {
  return (
    <>
      <Header label={["管理画面"]} />
      <Main className="gap-4">
        <PageHeader>
          <BreadCrumb>
            <BreadCrumbText>コレクション一覧</BreadCrumbText>
          </BreadCrumb>
        </PageHeader>
        {!collections.length && <EmptyCollectionCard />}
        {!!collections.length &&
          collections.map((c) => (
            <CollectionCard key={c.pkey} collection={c} />
          ))}
      </Main>
    </>
  );
}

export const getServerSideProps = userServerSideProps<Props>(
  "admin",
  async () => {
    const collections = await CollectionModel.listAllCollection();
    return {
      props: {
        collections,
      },
    };
  }
);
