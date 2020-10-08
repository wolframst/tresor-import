const path = require('path');
// bundles source of tresor-import AND demo page into demo/bundle to power the demo

module.exports = {
  mode: 'development',
  watch: true,
  entry: './demo/js/main.js',
  devtool: 'inline-source-map',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'demo/bundle'),
    publicPath: 'demo/bundle/',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
};
