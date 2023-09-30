/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./constants/**/*.{js,ts}",
    "./utils/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      animation: {
        "fade-in-fwd":
          "fade-in-fwd 1.2s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
        "fade-in-fwd-txt-1":
          "fade-in-fwd 4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
        "fade-in-fwd-txt-2":
          "fade-in-fwd 4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
        "fade-in-fwd-txt-3":
          "fade-in-fwd 4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
        "fade-in-fwd-txt-4":
          "fade-in-fwd 4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
        "fade-in-fwd-txt-5":
          "fade-in-fwd 4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
        "fade-in-fwd-txt-6":
          "fade-in-fwd 4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
        "fade-in-fwd-txt-7":
          "fade-in-fwd 4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
      },
      keyframes: {
        "fade-in-fwd": {
          "0%": {
            transform: "translateZ(-80px)",
            opacity: "0",
          },
          to: {
            transform: "translateZ(0)",
            opacity: "1",
          },
        },
      },
    },
    container: {
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1280px",
      },
    },
  },
  plugins: [],
};
