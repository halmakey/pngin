import React, {
  FC,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

export interface PopupProps {
  children?: ReactNode;
  show?: boolean;
  onDismiss?: (show: boolean) => void;
}

const Popup: FC<PopupProps> = ({ children, show, onDismiss }) => {
  const [currentShow, setCurrentShow] = useState(show);

  useEffect(() => {
    setCurrentShow(show);
  }, [show]);

  const handleClose = useCallback(() => {
    setCurrentShow(false);
    onDismiss?.(false);
  }, [onDismiss]);

  const stopPropagation = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (!currentShow) {
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
  }, [currentShow]);

  return (
    <div
      className="fixed left-0 top-0 z-20 h-screen w-screen text-white transition"
      style={{
        opacity: currentShow ? 1 : 0,
        pointerEvents: currentShow ? "auto" : "none",
      }}
      onClick={handleClose}
    >
      <div className="container relative mx-auto h-full w-full">
        <div
          className="absolute top-16 right-4 h-auto w-auto rounded bg-gray-700"
          onClick={stopPropagation}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Popup;
