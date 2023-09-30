import { MutableRefObject, useEffect } from "react";

export default function useBlockCallback<T extends HTMLElement | null>(
  allowRef: MutableRefObject<T>,
  onClose: () => void
) {
  useEffect(() => {
    const clickToCancel = (e: MouseEvent) => {
      if (e.target && allowRef.current?.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("mousedown", clickToCancel);
    return () => {
      window.removeEventListener("mousedown", clickToCancel);
    };
  }, [allowRef, onClose]);

  useEffect(() => {
    const escToCancel = (e: KeyboardEvent) => {
      if (e.code !== "Escape") {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", escToCancel);
    return () => {
      window.removeEventListener("keydown", escToCancel);
    };
  }, [onClose]);

  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    window.addEventListener("wheel", preventScroll, { passive: false });
    return () => {
      window.removeEventListener("wheel", preventScroll);
    };
  }, []);
}
