import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef } from "react";

export default forwardRef<
  HTMLTextAreaElement,
  {
    message?: string | null;
    editable?: boolean;
  }
>(function RejectMessageArea({ message, editable }, ref) {
  if (!message && !editable) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="bg-red-500 p-2 text-sm font-bold text-white">
        <FontAwesomeIcon icon={faTriangleExclamation} /> メッセージ
      </div>
      <textarea
        ref={ref}
        className="min-h-[64px] w-[400px] min-w-[320px] border-2 border-red-500 bg-red-100 p-2 outline-none"
        rows={3}
        maxLength={100}
        placeholder="メッセージ (100文字以内)"
        defaultValue={message ?? ""}
        readOnly={!editable}
      />
    </div>
  );
});
