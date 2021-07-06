// tailwind.config.js
// module.exports = {
//   mode: "jit",
//   purge: ["{pages,app}/**/*.{js,ts,jsx,tsx}"],
//   darkMode: false, // or 'media' or 'class'
//   theme: {
//     extend: {},
//   },
//   variants: {
//     extend: {},
//   },
//   plugins: [],
// }
// tailwind.config.js
const colors = require("tailwindcss/colors")
module.exports = {
  mode: "jit",
  purge: ["{app,pages}/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        orange: colors.orange,
        cyan: colors.cyan,
        teal: colors.teal,
        emerald: colors.emerald,
      },
    },
    fontFamily: {
      sans: [
        "Montserrat",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "ui-sans-serif",
        "system-ui",
      ],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
