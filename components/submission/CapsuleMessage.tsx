export type CapsuleMessageStatus = "green" | "gray" | "orange";

const STATUS_TEXT_COLORS: Record<CapsuleMessageStatus, string> = {
  green: "text-green-800 border-green-800 bg-green-100",
  gray: "text-zinc-600 border-zinc-600 bg-gray-100",
  orange: "text-orange-700 border-orange-700 bg-orange-100",
};

const STATUS_SUBJECT_COLORS: Record<CapsuleMessageStatus, string> = {
  green: "text-white border-green-800 bg-green-800",
  gray: "text-white border-zinc-600 bg-zinc-600",
  orange: "text-white border-orange-700 bg-orange-700",
};

export default function CapsuleMessage({
  subject,
  message,
  status,
}: {
  subject: string;
  message: string;
  status: CapsuleMessageStatus;
}) {
  return (
    <div>
      <span className={`p-3 ${STATUS_SUBJECT_COLORS[status]} border font-bold`}>
        {subject}
      </span>
      <span className={`p-3 ${STATUS_TEXT_COLORS[status]} border`}>
        {message}
      </span>
    </div>
  );
}
