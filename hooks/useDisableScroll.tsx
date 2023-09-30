import { useEffect } from "react";

export default function useDisableScroll(disable: boolean) {
  useEffect(() => {
    if (!disable) {
      return;
    }
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    window.addEventListener("wheel", preventScroll, { passive: false });
    return () => {
      window.removeEventListener("wheel", preventScroll);
    };
  }, [disable]);
}
