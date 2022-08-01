const path = require('path');
const zlib = require('zlib');
const webpack = require('webpack');
const getNxWebpackConfig = require('@nrwl/react/plugins/webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Style9Plugin = require('style9/webpack');

const enableBundleAnalyzer = process.env.BUNDLE_ANALYZER;

module.exports = function (webpackConfig) {
    const config = getNxWebpackConfig(webpackConfig);

    const isProd = config.mode === 'production';

    const style9 = {
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        use: [
            {
                loader: Style9Plugin.loader,
                options: {
                    minifyProperties: isProd,
                    incrementalClassnames: isProd,
                },
            },
        ],
    };

    config.experiments.topLevelAwait = true;

    if (isProd) {
        config.module.rules.unshift(style9);
    } else {
        config.module.rules.push(style9);
    }

    if (isProd) {
        config.entry = {
            main: [...config.entry.main, ...config.entry.polyfills],
        };
        config.devtool = false;
        config.output = {
            ...config.output,
            filename: '[name].[contenthash:8].js',
            chunkFilename: '[name].[chunkhash:8].js',
            hashFunction: undefined,
        };
        config.optimization = {
            nodeEnv: 'production',
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: 2020,
                    },
                    extractComments: true,
                    parallel: true,
                }),
                new CssMinimizerPlugin(),
            ],
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    styles: {
                        name: 'styles',
                        type: 'css/mini-extract',
                        chunks: 'all',
                        enforce: true,
                    },
                    auth: {
                        test: /[\\/]node_modules[\\/](@authing|@?firebase)/,
                        name: 'auth',
                        priority: -5,
                        chunks: 'all',
                    },
                    whiteboard: {
                        test: /(libs\/components\/board-|[\\/]node_modules[\\/]@tldraw)/,
                        name: 'whiteboard',
                        priority: -7,
                        chunks: 'all',
                    },
                    editor: {
                        test: /(libs\/framework\/(ligo|virgo|editor)|[\\/]node_modules[\\/](@codemirror|@lezer|slate))/,
                        name: 'editor',
                        priority: -8,
                        chunks: 'all',
                    },
                    ui: {
                        test: /[\\/]node_modules[\\/](@mui|@emotion|react|katex)/,
                        name: 'ui',
                        priority: -9,
                        chunks: 'all',
                    },
                    vender: {
                        test: /([\\/]node_modules[\\/]|polyfills|@nrwl)/,
                        name: 'vender',
                        priority: -10,
                        chunks: 'all',
                    },
                },
            },
        };
        config.module.rules.unshift({
            test: /\.css$/i,
            use: [
                MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: false,
                    },
                },
            ],
        });
        config.module.rules.unshift({
            test: /\.scss$/i,
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: false,
                    },
                },
                {
                    loader: 'postcss-loader',
                },
            ],
        });
        config.module.rules.splice(6);
    } else {
        config.output = {
            ...config.output,
            publicPath: '/',
        };

        const babelLoader = config.module.rules.find(
            rule =>
                typeof rule !== 'string' &&
                rule.loader?.toString().includes('babel-loader')
        );
        if (babelLoader && typeof babelLoader !== 'string') {
            babelLoader.options['plugins'] = [
                ...(babelLoader.options['plugins'] || []),
                [require.resolve('babel-plugin-open-source')],
            ];
        }
    }

    config.plugins = [
        ...config.plugins.filter(
            p => !(isProd && p instanceof MiniCssExtractPlugin)
        ),
        new webpack.DefinePlugin({
            JWT_DEV: !isProd,
            global: {},
        }),
        isProd &&
            new HtmlWebpackPlugin({
                title: 'AFFiNE - All In One Workos',
                favicon: path.resolve(
                    __dirname,
                    './src/assets/images/favicon.ico'
                ), //favicon path
                template: path.resolve(__dirname, './src/template.html'),
                publicPath: '/',
            }),
        new Style9Plugin(),
        isProd && new MiniCssExtractPlugin(),
        isProd &&
            new CompressionPlugin({
                test: /\.(js|css|html|svg|ttf|woff)$/,
                algorithm: 'brotliCompress',
                filename: '[path][base].br',
                compressionOptions: {
                    params: {
                        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                    },
                },
            }),
        isProd &&
            enableBundleAnalyzer &&
            new BundleAnalyzerPlugin({ analyzerMode: 'static' }),
    ].filter(Boolean);

    // Workaround for webpack infinite recompile errors
    config.watchOptions = {
        // followSymlinks: false,
        ignored: ['**/*.css'],
    };

    return config;
};
