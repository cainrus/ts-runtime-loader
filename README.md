# ts-runtime-loader
ts-runtime loader for webpack
### Installation

```bash
yarn add ts-runtime-loader
```

or

```bash
npm install ts-runtime-loader
```

You will also need to install TypeScript if you have not already.

```bash
yarn add typescript
```

or

```bash
npm install typescript
```

### Configuration

1. Create or update `webpack.config.js` like so:

```javascript
module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: "./app.ts",
  output: {
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      // ts-runtime-loader must be before ts-loader.
      { test: /\.runtime\.ts$/, loader: "ts-runtime-loader" },
      { test: /\.ts$/, loader: "ts-loader" },
    ]
  }
};
```