import { ForwardedRef, useEffect } from "react";

export default function useStateToRef<T>(state: T, ref: ForwardedRef<T>) {
  useEffect(() => {
    if (!ref) {
      return;
    }
    if (typeof ref === "function") {
      ref(state);
      return;
    }
    ref.current = state;
  }, [ref, state]);
}
