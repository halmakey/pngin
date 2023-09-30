import { SVGProps } from "react";

export default function Component(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      {...props}
    >
      <style jsx>{`
        .sq1 {
          opacity: 0;
          fill: #d9d9d9;
          animation: fade 2s linear 1s infinite;
        }

        .sq2 {
          opacity: 0;
          fill: #d9d9d9;
          animation: fade 2s linear 1.1s infinite;
        }

        .sq3 {
          opacity: 0;
          fill: #d9d9d9;
          animation: fade 2s linear 1.2s infinite;
        }

        .sq4 {
          opacity: 0;
          fill: #d9d9d9;
          animation: fade 2s linear 1.3s infinite;
        }

        .g1 {
          animation: rotate 2s linear 1.4s infinite;
        }

        @keyframes fade {
          0% {
            opacity: 0;
            transform: scale(2);
            transform-origin: 50% 50%;
          }

          5% {
            opacity: 1;
            transform: scale(1);
            transform-origin: 50% 50%;
          }

          60% {
            opacity: 1;
            transform: scale(1);
            transform-origin: 50% 50%;
          }

          65% {
            opacity: 0;
            transform: scale(2);
            transform-origin: 50% 50%;
          }
        }

        @keyframes rotate {
          0% {
            transform: rotate(0deg);
            transform-origin: 50% 50%;
          }

          20% {
            transform: rotate(0deg);
            transform-origin: 50% 50%;
          }

          35% {
            transform: rotate(90deg);
            transform-origin: 50% 50%;
          }

          80% {
            transform: rotate(90deg);
            transform-origin: 50% 50%;
          }
          81% {
            transform: rotate(0deg);
            transform-origin: 50% 50%;
          }

          100% {
            transform: rotate(0deg);
            transform-origin: 50% 50%;
          }
        }
      `}</style>
      <g className="g1">
        <rect className="sq1" width="12" height="12" />
        <rect className="sq2" x="16" width="12" height="12" />
        <rect className="sq3" y="16" width="12" height="12" />
        <rect className="sq4" x="16" y="16" width="12" height="12" />
      </g>
    </svg>
  );
}
