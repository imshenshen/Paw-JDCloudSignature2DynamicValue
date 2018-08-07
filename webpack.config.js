var webpack = require("webpack");
var name = "JDCloudSignature2DynamicValue";
var path = require("path");

var config = {
  entry: ["./src/JDCloudSignature2DynamicValue.js"],
  output: {
    filename: `${name}.js`
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [path.resolve(__dirname, "src")],
        use: "babel-loader"
      }
    ]
  }
};

module.exports = config;
