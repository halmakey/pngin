import { useCallback, useMemo } from "react";

export function useRecaptcha() {
  const execute = useCallback(
    (action: string) =>
      new Promise((resolve) =>
        grecaptcha.ready(resolve.bind(undefined, undefined))
      ).then(() =>
        grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!, {
          action,
        })
      ),
    []
  );
  return useMemo(() => ({ execute }), [execute]);
}
