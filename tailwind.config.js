/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        "panel-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(18px) scale(0.985)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "row-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(14px)",
          },
          "60%": {
            opacity: "1",
            transform: "translateY(-2px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        blink: 'blink 1s ease-in-out infinite',
        "panel-in": "panel-in 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        "row-in": "row-in 280ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
}
