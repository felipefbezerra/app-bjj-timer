// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  // sw.template.js vira o dist/sw.js no build (tem marcadores trocados pelo scripts/pwa.js).
  { ignores: ['dist/*', 'android/*', 'ios/*', 'scripts/sw.template.js'] },
  { files: ['scripts/**/*.js', 'plugins/**/*.js'], languageOptions: { globals: { __dirname: 'readonly', require: 'readonly', module: 'writable', process: 'readonly' } } },
]);
