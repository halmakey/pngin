import Header from "@/components/Header";
import Main from "@/components/Main";
import { Author, Collection, Reject, Submission, User } from "@/types/model";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import SubmissionDropList, {
  SubmissionImageStateExists,
  SubmissionImageStateNew,
  SubmissionState,
} from "@/components/submission/SubmissionDropList";
import CreditDrop, {
  CreditDropState,
} from "@/components/submission/CreditDrop";
import Script from "next/script";
import { ReCaptchaCredit } from "@/components/ReCaptchaCredit";
import { useRecaptcha } from "@/hooks/useRecaptcher";
import { isValidatorError, nanoIDValidator } from "@/utils/validator";
import { useRouter } from "next/router";
import { useAsyncCallback } from "@/hooks/useAsyncCallback";
import CheckMessage from "@/components/submission/CheckMessage";
import { getImageUrl } from "@/utils/url";
import { userServerSideProps } from "@/utils/ssr/server-side-props";
import {
  AuthorModel,
  CollectionModel,
  RejectModel,
  SubmissionModel,
} from "@/models";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCancel, faUpload, faXmark } from "@fortawesome/free-solid-svg-icons";
import ProgressCircle from "@/components/assets/ProgressCircle";
import RejectMessageArea from "@/components/submission/RejectMessageArea";
import useMyReject from "@/hooks/useMyReject";
import useCollection from "@/hooks/useCollection";
import { UserAPI } from "@/utils/api";
import { createConcurrent } from "@/utils/concurrent";

interface Props {
  me: User | null;
  collection: Collection;
  author: Author | null;
  reject: Reject | null;
  submissions: Submission[];
}

export default function Page({
  me,
  collection: initialCollection,
  author,
  submissions,
  reject: initialReject,
}: Props) {
  const router = useRouter();
  const recaptcha = useRecaptcha();
  const [creditState, setCreditState] = useState<CreditDropState>();
  const [submissionsState, setSubmissionsState] = useState<SubmissionState>();
  const [authorName, setAuthorName] = useState<string | undefined>(
    author?.name || me?.name
  );
  const {
    data: { collection },
  } = useCollection(initialCollection.id, initialCollection, true);
  const {
    data: { reject },
  } = useMyReject(collection.id, initialReject, true);
  const { formActive } = collection;

  const [isOpenSubmission, setOpenSubmission] = useState(!!author);
  const handleOpenSubmission = useCallback(() => {
    if (!me) {
      router.push(
        `/api/auth/signin?callback=${encodeURIComponent(
          `/submission/${collection.id}`
        )}`
      );
      return;
    }
    setOpenSubmission(true);
  }, [collection, router, me]);

  const { canSubmit, hasName, hasCreditImage, hasSubmitImages } =
    useMemo(() => {
      const hasName = !!authorName;
      const hasCreditImage = !!creditState?.imageUrl || !!creditState?.blob;
      const hasSubmitImages =
        !!submissionsState &&
        submissionsState.images.reduce(
          (p, c) => p || !!c.image || !!c.submission,
          false
        );
      const authorChanged = author?.name !== authorName || !!creditState?.blob;
      const submissionsChanged = !!submissionsState?.changed;

      const canSubmit =
        hasName &&
        hasCreditImage &&
        hasSubmitImages &&
        (authorChanged || submissionsChanged);

      return {
        canSubmit,
        hasName,
        hasCreditImage,
        hasSubmitImages,
        authorChanged,
        submissionsChanged,
      };
    }, [
      author?.name,
      authorName,
      creditState?.blob,
      creditState?.imageUrl,
      submissionsState,
    ]);

  const {
    call: handleSubmit,
    pending: submitPending,
    error: submitError,
  } = useAsyncCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!canSubmit || !authorName || !submissionsState || !creditState) {
        return;
      }

      const {
        collection: { formActive },
      } = await UserAPI.getCollection(collection.id);
      if (!formActive && !reject) {
        alert("出展フォームの受付が終了しました。");
        router.reload();
        return;
      }

      if (!confirm("出展作品を登録します。よろしいですか？")) {
        return;
      }

      const nextImages = submissionsState.images
        .filter((i) => i.image || i.submission)
        .map((i) => ({ ...i })) as (
        | SubmissionImageStateExists
        | SubmissionImageStateNew
      )[];
      const postingImages = nextImages
        .filter((image) => image.image)
        .map((image) => image.image) as SubmissionImageStateNew["image"][];

      if (creditState?.blob) {
        postingImages.push({
          blob: creditState.blob,
          width: 700,
          height: 400,
        });
      }

      let postedImages: { id: string; width: number; height: number }[] = [];
      if (postingImages.length > 0) {
        const result = await UserAPI.postImages({
          token: await recaptcha.execute("postimage"),
          count: postingImages.length,
        });
        const queue = createConcurrent(2);
        postedImages = await Promise.all(
          result.images.map(({ post, id }, index) => {
            return queue.queue(async () => {
              const { blob, width, height } = postingImages[index];
              await UserAPI.postSignedUrl(post, blob);
              return {
                id,
                width,
                height,
              };
            });
          })
        );
      }

      const nextCreditImageId = creditState?.blob
        ? postedImages[postedImages.length - 1]!.id
        : author!.imageId;

      const submissions = nextImages.map<{
        imageId: string;
        comment: string;
        width: number;
        height: number;
      }>(({ submission, image }) => {
        if (submission) {
          return {
            imageId: submission.imageId,
            comment: submission.comment,
            width: submission.width,
            height: submission.height,
          };
        }
        if (image) {
          const { id: imageId, width, height } = postedImages.shift()!;
          return { imageId, comment: "", width, height };
        }
        throw new Error("unexpected state");
      });
      await UserAPI.putAuthorSubmissions({
        token: await recaptcha.execute("submit"),
        collectionId: collection.id,
        author: {
          name: authorName,
          comment: "",
          imageId: nextCreditImageId,
        },
        submissions,
      });

      alert("登録が完了しました。");

      router.reload();
    },
    [
      canSubmit,
      authorName,
      submissionsState,
      creditState,
      collection.id,
      reject,
      author,
      recaptcha,
      router,
    ]
  );
  useEffect(() => {
    if (!submitError) {
      return;
    }
    const message = `エラーが発生しました。(${String(
      submitError
    )}) \n時間を開けてもう一度お試しいただくか、解決しない場合は投稿する内容を変更して試してください。\n解決しない場合はお問い合わせください。`;
    alert(message);
    router.reload();
  }, [collection.id, router, submitError]);

  const { call: cancelSubmission, pending: cancelPending } =
    useAsyncCallback(async () => {
      if (author) {
        const {
          collection: { formActive },
        } = await UserAPI.getCollection(collection.id);
        if (!formActive && !reject) {
          alert("出展フォームの受付が終了しました。");
          router.reload();
          return;
        }

        if (
          !confirm(
            `出展を取り消します。\n${collection.name} にアップロード済みの作品は削除されます。\nよろしいですか？`
          )
        ) {
          return;
        }
        if (
          reject &&
          !formActive &&
          !confirm(
            `⚠ 募集期間外のため、出展を取り消すと再登録ができなくなります。本当によろしいですか？`
          )
        ) {
          return;
        }

        await UserAPI.deleteAuthorSubmissions({
          token: await recaptcha.execute("delete"),
          collectionId: collection.id,
        });
        router.reload();
        return;
      }
      setOpenSubmission(false);
    }, [author, collection.id, collection.name, recaptcha, reject, router]);

  const handleChangeAuthorName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAuthorName(e.target.value);
    },
    []
  );

  const formCheckStatus = useMemo(() => {
    const save = author ? "更新" : "出展登録";
    if (canSubmit) {
      return {
        color: "green",
        message: `内容を確認して${save}ボタンを押してください`,
      } as const;
    }
    return !hasName
      ? ({
          color: "orange",
          message: "出展者名を入力してください",
        } as const)
      : !hasSubmitImages
      ? ({
          color: "orange",
          message: "作品を追加してください",
        } as const)
      : !hasCreditImage
      ? ({
          color: "orange",
          message: "クレジット画像を設定してください",
        } as const)
      : ({ color: "gray", message: "変更はありません" } as const);
  }, [author, canSubmit, hasCreditImage, hasName, hasSubmitImages]);

  const submitStatus = useMemo(() => {
    if (!author) {
      if (formActive) {
        return {
          message:
            "募集期間中です。フォームに入力して「出展登録」ボタンから出展登録してください。",
          color: "green",
        } as const;
      }
      return {
        message: "募集期間外です。次の情報公開をお待ち下さい。",
        color: "gray",
      } as const;
    }
    if (reject?.status === "reject") {
      return {
        message:
          "再提出が依頼されています。⚠マークの付いている画像を差し替えて再提出してください。",
        color: "red",
      } as const;
    }
    if (reject?.status === "review") {
      return {
        message:
          "再提出レビュー待ちです。スタッフにレビューを依頼してください。",
        color: "green",
      } as const;
    }
    if (formActive) {
      return {
        message: "出展登録済みです。募集期間中は登録内容を更新できます。",
        color: "gray",
      } as const;
    }
    return {
      message: "募集期間外です。出展登録済みの情報を確認できます。",
      color: "gray",
    } as const;
  }, [author, reject?.status, formActive]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
      />
      <Header label={collection.name} />
      <Main>
        <div className="flex flex-col items-start gap-4">
          <h1>{collection.name}</h1>
          <p>
            {collection.name} 出展および修正用のフォームです。
            <br />
            {collection.url && (
              <>
                詳細については下記をご覧ください。
                <br />
                <a href={collection.url} target="_blank" rel="noreferrer">
                  {collection.url}
                </a>
              </>
            )}
          </p>
          {!isOpenSubmission &&
            (formActive ? (
              <button
                className="btn-fill mt-8 w-[240px]"
                onClick={handleOpenSubmission}
              >
                {!me ? "Disordでログインして続ける" : "作品を投稿する"}
              </button>
            ) : (
              <CheckMessage color={submitStatus.color}>
                {submitStatus.message}
              </CheckMessage>
            ))}
          {isOpenSubmission && (
            <div className="mt-8 flex flex-col items-start gap-4">
              <div className="flex flex-row">
                <CheckMessage color={submitStatus.color}>
                  {submitStatus.message}
                </CheckMessage>
              </div>
              {!!reject?.message && (
                <RejectMessageArea message={reject.message} />
              )}
              <form
                onSubmit={handleSubmit}
                className={`mt-8 flex flex-col items-start gap-4 ${
                  submitPending || cancelPending
                    ? "pointer-events-none select-none"
                    : ""
                }`}
              >
                <label htmlFor="name" className="font-bold">
                  出展者名
                </label>
                <input
                  className="border border-gray-500 p-1 outline-none"
                  type="text"
                  id="name"
                  name="name"
                  placeholder="投稿者名を入力する"
                  defaultValue={authorName}
                  required
                  onChange={handleChangeAuthorName}
                  maxLength={64}
                  disabled={!formActive && !reject}
                  readOnly={!formActive && !reject}
                />
                <label className="font-bold">作品</label>
                <SubmissionDropList
                  defaultSubmissions={submissions}
                  onStateChange={setSubmissionsState}
                  disabled={!formActive && !reject}
                  warnIds={reject?.imageIds}
                  maxSubmissions={collection.submissionsPerAuthor}
                />
                <label htmlFor="credit" className="font-bold">
                  クレジット画像
                </label>
                <CreditDrop
                  defaultImageUrl={
                    author?.imageId && getImageUrl(author.imageId)
                  }
                  onChange={setCreditState}
                  disabled={!formActive && !reject}
                  warn={!!author && !!reject?.imageIds.includes(author.imageId)}
                />
                {(formActive || reject) && (
                  <>
                    <label htmlFor="check" className="font-bold">
                      登録前チェック
                    </label>
                    <CheckMessage color={formCheckStatus.color}>
                      {formCheckStatus.message}
                    </CheckMessage>
                    <div className="mt-8 flex flex-row gap-2">
                      <button
                        type="button"
                        className="btn-border"
                        onClick={cancelSubmission}
                        disabled={
                          submitPending ||
                          cancelPending ||
                          (!formActive && !reject)
                        }
                      >
                        {author ? (
                          <FontAwesomeIcon icon={faCancel} />
                        ) : (
                          <FontAwesomeIcon icon={faXmark} />
                        )}
                        {author ? "出展取消" : "キャンセル"}
                      </button>
                      <button
                        type="submit"
                        className="btn-fill"
                        disabled={
                          !canSubmit ||
                          submitPending ||
                          (!formActive && !reject)
                        }
                      >
                        {submitPending || cancelPending ? (
                          <>
                            <ProgressCircle width={16} />
                            処理中...
                          </>
                        ) : author ? (
                          <>
                            <FontAwesomeIcon icon={faUpload} />
                            更新
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faUpload} />
                            出展登録
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}
          {(!!formActive || !!reject) && (
            <div className="mt-8 flex flex-1 flex-col self-center">
              <ReCaptchaCredit />
            </div>
          )}
        </div>
      </Main>
    </>
  );
}

export const getServerSideProps = userServerSideProps<Props>(
  "guest",
  async ({ params, req }) => {
    try {
      const collectionId = nanoIDValidator(
        params?.collectionId,
        "params.collectionId"
      );

      const collection = await CollectionModel.getCollection(collectionId);
      if (!collection) {
        return {
          notFound: true,
        };
      }
      const me = params?.me;

      if (!me) {
        return {
          props: {
            me: null,
            collection,
            author: null,
            reject: null,
            submissions: [],
          },
        };
      }

      const authorId = AuthorModel.getAuthorID(collectionId, me.id);
      const [author, reject] = await Promise.all([
        AuthorModel.getAuthor(authorId),
        RejectModel.getReject(authorId),
      ]);
      let submissions = author
        ? await SubmissionModel.findSubmissionsByAuthor(author.id)
        : [];
      submissions = submissions.sort(({ sequence: a }, { sequence: b }) =>
        a > b ? 1 : -1
      );

      return {
        props: {
          me: me ?? null,
          collection,
          author: author ?? null,
          reject: reject ?? null,
          submissions,
        },
      };
    } catch (err) {
      if (isValidatorError(err)) {
        console.warn(err);
        return {
          notFound: true,
        };
      }
      throw err;
    }
  }
);
