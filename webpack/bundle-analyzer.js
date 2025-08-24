/**
 * @prettier
 */

const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const configBuilder = require("./_config-builder")

const result = configBuilder(
  {
    minimize: true,
    mangle: true,
    sourcemaps: true,
    includeDependencies: true,
  },
  {
    entry: {
      "swagger-ui-bundle-analyzer": ["./src/index.js"],
    },
    
    output: {
      globalObject: "this",
      filename: "[name].[contenthash].js",
      chunkFilename: "[name].[contenthash].chunk.js",
      library: {
        name: "SwaggerUIBundle",
        export: "default",
      },
    },

    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-analysis-report.html',
        defaultSizes: 'gzip',
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
      }),
    ],
  }
)

module.exports = result