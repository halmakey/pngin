function check(value: string | undefined) {
  if (!value) {
    throw new Error("value is empty");
  }
}

export function checkAllEnvs() {
  check(process.env.DISCORD_OAUTH_CLIENT_ID);
  check(process.env.DISCORD_OAUTH_CLIENT_SECRET);
  check(process.env.PNGIN_JWT_PRIVATE_KEY);
  check(process.env.PNGIN_JWT_PUBLIC_KEY);
  check(process.env.RECAPTCHA_SECRET_KEY);
}
