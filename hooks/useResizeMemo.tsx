import { RefObject, useEffect, useMemo, useRef, useState } from "react";

export default function useResizeMemo<E extends Element, R>(
  generator: (entry?: ResizeObserverEntry) => R,
  dependencies: unknown[]
): {
  ref: RefObject<E>;
  value: ReturnType<typeof generator>;
} {
  const ref = useRef<E>(null);
  const [value, setValue] = useState(generator);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const result = generator(entry);
      setValue(result);
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current, ...dependencies]);
  return useMemo(() => ({ ref, value }), [value]);
}
