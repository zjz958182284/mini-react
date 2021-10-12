const {merge}=require('webpack-merge')
const baseConfig=require('./webpack.base.config')
const path=require('path')
const webpack=require('webpack')
module.exports=merge(baseConfig,{
    output: {
        filename: 'bundle.js',
        clean:true,
        path:path.resolve(__dirname,'dist-dev')
      },
    mode:'development',
    devtool:'inline-source-map',
    devServer:{
        hot:true,
        port:3333,
        static:{
            // directory:'./dist-dev',
            // publicPath:'/'
        },
        watchFiles:['src/*']      
    },
})