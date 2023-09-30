/* Reason resolve by provided props */
/* eslint-disable jsx-a11y/alt-text */
import { ImgHTMLAttributes } from "react";

export default function Avatar(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      width="48px"
      height="48px"
      {...props}
      className="rounded-full"
      draggable={false}
    />
  );
}
