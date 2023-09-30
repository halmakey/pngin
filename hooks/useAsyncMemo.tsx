import { useEffect, useMemo, useState } from "react";

export function useAsyncMemo<T>(
  generator: () => Promise<T>,
  dependencies: unknown[]
) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<T | undefined>();
  const [error, setError] = useState<unknown | undefined>(undefined);

  useEffect(
    () => {
      setPending(true);
      setResult(undefined);
      setError(undefined);
      generator().then(
        (result) => {
          setResult(result);
          setPending(false);
        },
        (err) => {
          setError(err);
          setPending(false);
        }
      );
    },
    // Reason: Behave like useMemo
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  );

  return useMemo(
    () => ({
      pending,
      result,
      error,
    }),
    [error, pending, result]
  );
}
