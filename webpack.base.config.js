const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports={
    entry:"./src/index.js",
    // resolve:{
    //     "extensions":['*','js','jsx','ts','tsx'],
    //     "modules":["node_modules"]
    // },
    module:{
        rules:[
            //useEntry
            {
                test:/\.jsx?$/,
                exclude:/node_modules/,
                use:{
                    loader:'babel-loader',
                    options:{
                        babelrc:true,
                        presets:['@babel/preset-react','@babel/preset-env'],
                        cacheDirectory:true
                    }
                }
            }
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            filename:'index.html',
            template:'src/index.html',
            title:'MiniReact'
        })
    ],
    optimization:{}
}