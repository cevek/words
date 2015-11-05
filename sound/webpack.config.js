module.exports = {
    context: context,
    entry: {
        app: './tsx/index.tsx',
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
