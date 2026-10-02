import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  astro: true,
  unocss: true,
  ignores: [
    '.astro/**',
    '.local/**',
    '2023/**',
    '2025/**',
    'about/**',
    'archives/**',
    'assets/**',
    'categories/**',
    'css/**',
    'dist/**',
    'fonts/**',
    'images/**',
    'js/**',
    'lib/**',
    'links/**',
    'page/**',
    'public/**',
    'src/content/**',
    'tags/**',
  ],
  rules: {
    'e18e/prefer-static-regex': 'off',
  },
})
