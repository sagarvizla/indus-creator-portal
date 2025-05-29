import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',     // Adjusted path
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',   // Adjusted path (include if you might add a 'pages' dir in 'src')
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // Adjusted path
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // require('@tailwindcss/line-clamp'), // Keep this commented out for now unless you've installed it
  ],
};
export default config;
