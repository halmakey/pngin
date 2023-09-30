import CheckMessage, {
  CheckMessageColor,
} from "@/components/submission/CheckMessage";
import {
  faCancel,
  faCheck,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { Author, Reject } from "@/types/model";
import { Dot } from "@/components/Dot";
import { DotColor } from "@/components/Dot";
import { useAsyncCallback } from "@/hooks/useAsyncCallback";
import RejectMessageArea from "@/components/submission/RejectMessageArea";
import { AdminAPI } from "@/utils/api";

export default function RejectForm({
  reject,
  author,
  selection,
  onDelete,
  onSubmit,
}: {
  author: Author;
  selection: Set<string>;
  reject: Reject | null;
  onDelete: () => void;
  onSubmit: () => void;
}) {
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [open, setOpen] = useState(!!reject);

  const [statusColor, statusLabel] = useMemo<[DotColor, string]>(() => {
    if (!reject) {
      return ["gray", "依頼なし"];
    }
    switch (reject.status) {
      case "review":
        return ["green", "レビュー待ち"];
      case "reject":
        return ["orange", "再提出待ち"];
      default:
        return ["red", "不明"];
    }
  }, [reject]);

  const { call: handleSubmit, pending: pendingSubmit } = useAsyncCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!open) {
        return;
      }
      if (
        !confirm(
          "再提出を依頼します。よろしいですか？\n※選択した画像には再提出マークが付きます"
        )
      ) {
        return;
      }
      try {
        const message = messageRef.current?.value ?? "";
        await AdminAPI.putAdminReject(author.id, {
          imageIds: Array.from(selection),
          message,
          status: "reject",
        });
        onSubmit();
      } catch (err) {
        console.warn(err);
        alert("リジェクトの投稿に失敗しました。");
      }
    },
    [author.id, onSubmit, open, selection]
  );
  const handleReset = useCallback(() => {
    if (!reject) {
      setOpen(false);
      return;
    }
    const confirmMessage =
      reject.status === "reject"
        ? "リジェクトを取り消します。よろしいですか？"
        : "リジェクトを解決します。よろしいですか？";
    if (!confirm(confirmMessage)) {
      return;
    }
    AdminAPI.deleteAdminReject(author.id).then(() => {
      onDelete();
    });
  }, [author, onDelete, reject]);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const [checkColor, checkLabel] = useMemo<
    readonly [CheckMessageColor, string]
  >(() => {
    if (!reject) {
      if (selection.size === 0) {
        return ["gray", "選択した画像をマークして再提出を依頼できます。"];
      }
      return [
        "orange",
        `${selection.size}件の画像をマークして再提出を依頼します`,
      ];
    }

    return (
      {
        reject: ["orange", "出展者に再提出を依頼してください。"],
        review: [
          "green",
          "再提出されました。内容をレビューし、「解決」か「再提出を依頼する」ボタンを押してください。",
        ],
        complete: ["gray", "解決済み"],
      } as const
    )[reject.status];
  }, [reject, selection.size]);

  const disabled = pendingSubmit;

  return (
    <div className="flex flex-col items-start gap-4">
      {!open && (
        <button
          type="button"
          className="btn-border-danger"
          onClick={handleOpen}
        >
          <FontAwesomeIcon icon={faWarning} />
          リジェクトフォームを表示する
        </button>
      )}
      {open && (
        <>
          <div className="flex items-center gap-4">
            <h2 className="m-0">リジェクト</h2>
            <Dot color={statusColor}>{statusLabel}</Dot>
          </div>
          <CheckMessage color={checkColor}>{checkLabel}</CheckMessage>
          <form
            className="flex flex-col items-start gap-4"
            onSubmit={handleSubmit}
            onReset={handleReset}
          >
            <RejectMessageArea
              ref={messageRef}
              message={reject?.message}
              editable
            />
            <div className="flex gap-4">
              {reject?.status !== "review" && (
                <button
                  className="btn-border-danger"
                  type="reset"
                  disabled={disabled}
                >
                  <FontAwesomeIcon icon={faCancel} />
                  {reject ? "取り消す" : "キャンセル"}
                </button>
              )}
              <button className="btn-fill-danger" type="submit">
                <FontAwesomeIcon icon={faWarning} />
                {"再提出を依頼する"}
              </button>
              {reject?.status === "review" && (
                <button className="btn-fill" type="reset" disabled={disabled}>
                  <FontAwesomeIcon icon={faCheck} />
                  {"解決"}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
