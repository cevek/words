var isProd = false;

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var AssetsPlugin = require('assets-webpack-plugin');
var Clean = require('clean-webpack-plugin');
var context = path.join(__dirname, 'srcts');
var assetsPath = path.join(__dirname, 'assets');


if (isProd) {
    var bundleName = 'js/bundle-[chunkhash].js';
    var vendorBundleName = 'js/vendor-bundle-[chunkhash].js';
    var styleBundleName = 'css/style-[chunkhash].css';
    var plugins = [
        new Clean(['assets']),
        new webpack.optimize.CommonsChunkPlugin("vendor", vendorBundleName),
        new webpack.optimize.UglifyJsPlugin({minimize: true}),
        new ExtractTextPlugin(styleBundleName),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': '"production"'
            }
        }),
        new AssetsPlugin({path: assetsPath}),
/*
        new HtmlWebpackPlugin({
            title: 'Betpub',
            template: './index.html',
            inject: 'body',
        }),
*/
    ];
}
else {
    bundleName = 'js/bundle.js';
    vendorBundleName = 'js/vendor-bundle.js';
    styleBundleName = 'css/style.css';

    plugins = [
        //new webpack.optimize.CommonsChunkPlugin("vendor", vendorBundleName),
        //new ExtractTextPlugin(styleBundleName),
        /*new HtmlWebpackPlugin({
            title: 'Betpub',
            template: 'src/index.html',
            inject: 'body',
        }),*/
    ];
}

module.exports = {
    context: context,
    entry: {
        app: './index.tsx',
        /*vendor: [
            //"react/dist/react.min.js"
            //"../vendor/react.min-0.13.3.js",
            //"../vendor/polyfills/Promise.min.js",
            //"../vendor/fast-react-0.0.1.js",
            //"socket.io-client",
            //"../vendor/fastclick.js"
        ]*/
    },
    output: {
        path: assetsPath,
        filename: bundleName,
        publicPath: ''
    },
    stats: {
        children: false
    },

    module: {
        loaders: [
            { test: /\.tsx?$/, loader: 'ts-loader' },
            {
                test: /\.s?css$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css?sourceMap!autoprefixer!sass?sourceMap')
            },
            {test: /\.(png|svg|gif)$/, loader: "url-loader?limit=100000"},
            {test: /\.jpg$/, loader: "file-loader"},
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                //loader: 'babel-fast-react',
                loader: 'babel',
                query: {
                    stage: 0,
                    loose: ["all"],
                    optional: ['runtime']
                }
            }
        ]
    },
    resolve: {
        alias: {
            //react: 'fast-react'
        },
        extensions: ['', '.js', '.jsx', '.ts', '.tsx']
    },
    devtool: isProd ? null : 'source-map',
    plugins: plugins
};
