/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 12:31:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 14:37:33
*/


module.exports = {
  entry: '',
  output: {
    filename: 'dist/bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx', '']
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