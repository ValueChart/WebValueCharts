/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 12:31:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-01 15:01:51
*/


module.exports = {
  entry: '',
  output: {
    filename: 'dist/bundle.js',
    externals: {
      'd3': './app/vendors/d3/d3.js'
    }
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx', ''],
    modulesDirectories: ['app/vendors/d3', 'node_modules/@angular']
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      }
    ]
  }
}