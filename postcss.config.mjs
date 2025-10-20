// Disable lightningcss usage in Tailwind/Next pipeline explicitly
process.env.NEXT_DISABLE_LIGHTNINGCSS = process.env.NEXT_DISABLE_LIGHTNINGCSS || '1';

const config = {
  plugins: ['@tailwindcss/postcss'],
};

export default config;
