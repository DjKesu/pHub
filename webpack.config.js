const path = require("path");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: "development", // 'production' for production
  entry: {
    popup: "./popup.js", // Your entry file
  },
  output: {
    path: path.resolve(__dirname, "dist"), // Output directory
    filename: "popup.bundle.js", // Bundle filename pattern
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Apply this rule to JavaScript files
        exclude: /node_modules/, // Don't transpile node_modules
        use: {
          loader: "babel-loader", // Use Babel loader
          options: {
            presets: ["@babel/preset-env"], // Transpile to ES5
          },
        },
      },
      // You can add more rules for other file types here
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "popup.html", to: "popup.html" },
        { from: "background.js", to: "background.bundle.js" }, 
      ],
    }),
  ],
};
