const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const webpack = require('webpack');

// 只保留标准字段
function filterOptions(options) {
  const allowed = [
    'entry', 'externals', 'plugins', 'output', 'module', 'resolve', 'target', 'mode', 'devtool', 'context',
    'watch', 'watchOptions', 'stats', 'optimization', 'performance', 'name', 'cache', 'infrastructureLogging',
    'experiments', 'externalsPresets', 'externalsType', 'ignoreWarnings', 'profile', 'recordsInputPath',
    'recordsOutputPath', 'recordsPath', 'resolveLoader', 'snapshot', 'dependencies', 'extends', 'bail', 'amd', 'loader'
  ];
  const filtered = {};
  for (const key of allowed) {
    if (options[key] !== undefined) filtered[key] = options[key];
  }
  return filtered;
}

module.exports = function (options) {
  const safeOptions = filterOptions(options || {});
  return {
    ...safeOptions,
    target: 'node',
    entry: ['webpack/hot/poll?100', './src/main.ts'],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    output: {
      ...(safeOptions.output || {}),
      publicPath: '/',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        path: false,
        fs: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        util: false,
        buffer: false,
        url: false,
        assert: false,
        tty: false,
        net: false,
        child_process: false,
        worker_threads: false,
        module: false,
        readline: false,
        perf_hooks: false,
        timers: false,
        events: false,
        vm: false,
        dns: false,
        dgram: false,
        cluster: false,
        repl: false,
        tls: false,
        punycode: false,
        querystring: false,
        string_decoder: false,
        v8: false,
      }
    },
    plugins: [
      ...(Array.isArray(safeOptions.plugins) ? safeOptions.plugins : []),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: (safeOptions.output && safeOptions.output.filename) ? safeOptions.output.filename : 'main.js' }),
    ],
  };
}; 