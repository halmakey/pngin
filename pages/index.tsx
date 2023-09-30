import Header from "@/components/Header";
import Main from "@/components/Main";
import CollectionCard, {
  EmptyCollectionCard,
} from "@/components/CollectionCard";
import AuthContext from "@/contexts/auth-context";
import { CollectionModel } from "@/models";
import { Collection } from "@/types/model";
import { GetStaticProps } from "next";
import { useContext } from "react";

interface Props {
  collections: Collection[];
}

export default function Page({ collections }: Props) {
  const { pending, user } = useContext(AuthContext);
  return (
    <>
      <Header />
      <Main>
        <p className="mb-8 mt-8"></p>
        <div className="mt-12 flex animate-fade-in-fwd flex-col gap-4 p-8">
          {!!collections.length &&
            collections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          {!collections.length && !pending && (
            <EmptyCollectionCard loggedIn={!!user} />
          )}
        </div>
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  let collections = await CollectionModel.listAllCollection();
  collections = collections.filter((c) => c.visible);

  return {
    props: {
      collections,
    },
    revalidate: 30,
  };
};
