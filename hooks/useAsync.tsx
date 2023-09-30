import { useEffect, useMemo, useState } from "react";

export interface UseAsync<T> {
  pending: boolean;
  result?: T;
  error?: unknown;
}

export function useAsync<T>(
  effect: () => Promise<T>,
  dependencies: unknown[]
): UseAsync<T> {
  const [pending, setPending] = useState(true);
  const [error, setError] = useState(undefined);
  const [result, setResult] = useState<T | undefined>(undefined);
  useEffect(() => {
    setPending(true);
    effect()
      .then(setResult, setError)
      .finally(() => setPending(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const state = useMemo(
    () => ({
      pending,
      result,
      error,
    }),
    [error, pending, result]
  );
  return state;
}
