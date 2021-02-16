/* eslint-disable @typescript-eslint/no-var-requires */
const tailwindcss = require('tailwindcss');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.ts'),
    require('autoprefixer'),
    // Only run Purge CSS when building for production!
    process.env.BUILD_TARGET !== 'dev' &&
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
