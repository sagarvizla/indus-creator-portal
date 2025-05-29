import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Include this if you have a 'pages' directory
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // If your components/app are inside a 'src' directory, use these instead or in addition:
    // './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // You can add custom theme extensions here later if needed
      // For example, if you used the Inter font via next/font, Tailwind usually picks it up.
      // If not, you might add:
      // fontFamily: {
      //   sans: ['var(--font-inter)', 'sans-serif'], // Assuming you set up Inter with a CSS variable --font-inter
      // },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'), // Add this if you installed and want to use the line-clamp plugin
  ],
};
export default config;
