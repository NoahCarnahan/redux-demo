module.exports = {
    devtool: 'source-map',
    context: __dirname,
    entry: "./redux-demo/scripts/src/index.js",
    output: {
        filename: "bundle.js",
        path: __dirname + "/redux-demo/scripts/build/"
    },
    module: {
        // https://www.twilio.com/blog/2015/08/setting-up-react-for-es6-with-webpack-and-babel-2.html
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                query: {
                    presets: ["es2015", "react"]
                }
            },
            {
                test: /\.css$/,
                loader: "style!css"
            }
        ]
    }
};
