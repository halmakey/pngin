import { Author } from "@/types/model";
import ImageCard from "../image/ImageCard";
import OverlayLink from "../image/OverlayLink";

interface Props {
  author?: Author;
}

export default function PreviewFooter({ author }: Props) {
  return (
    <div className="flex items-stretch gap-4 p-4">
      {author ? (
        <OverlayLink
          href={{
            pathname: "/admin/collection/[collectionId]/author/[authorId]",
            query: {
              collectionId: author.collectionId,
              authorId: author.id,
            },
          }}
          label={author.name}
        >
          <ImageCard
            imageId={author.imageId}
            thumbnailSize={300}
            width={210}
            height={120}
          />
        </OverlayLink>
      ) : (
        <div className="h-[120px] w-[210px]" />
      )}
    </div>
  );
}
