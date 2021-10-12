const {merge}=require('webpack-merge')
const baseConfig=require('./webpack.base.config')
const path=require('path')
module.exports=merge(baseConfig,{
    output: {
        filename: 'bundle.[hash:8].js',
        clean:true,
        path:path.resolve(__dirname,'dist')
      },
    mode:'production',
    devtool:'source-map'
})