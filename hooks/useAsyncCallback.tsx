import { useCallback, useState } from "react";

export function useAsyncCallback<A extends Array<unknown>, T>(
  generator: (...args: A) => Promise<T>,
  dependencies: unknown[]
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown | undefined>(undefined);

  const call = useCallback<(...args: A) => Promise<T>>(
    async (...args: A) => {
      setPending(true);
      setError(undefined);
      try {
        return await generator(...args);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setPending(false);
      }
    },
    // Reason: Behave like useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  );

  return {
    pending,
    call,
    error,
  };
}
