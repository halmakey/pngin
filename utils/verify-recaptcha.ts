export async function verifyRecaptchaToken({
  secret,
  response,
  remoteip,
}: {
  secret: string;
  response: string;
  remoteip: string;
}) {
  const params = new URLSearchParams({
    secret,
    response,
    remoteip,
  });
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const result = (await res.json()) as {
    success: boolean;
    score: number;
    action: string;
    challenge_ts: string;
    hostname: string;
    "error-codes": unknown;
  };
  return result;
}
