/* eslint-disable @typescript-eslint/no-var-requires */
const tailwindcss = require('tailwindcss');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.ts'),
    require('autoprefixer'),
    require('@fullhuman/postcss-purgecss')({
      content: [
        './src/**/*.ts',
        './src/**/*.js',
        './src/**/*.jsx',
        './src/**/*.tsx',
        './public/index.html',
      ],
      defaultExtractor: (content) => content.match(/[A-Za-z0-9-_:/]+/g) || [],
    }),
  ],
};
