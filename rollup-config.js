/*
* @Author: aaronpmishkin
* @Date:   2017-05-16 17:10:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-18 15:06:39
*/


import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs    from 'rollup-plugin-commonjs';
import uglify      from 'rollup-plugin-uglify'

export default {
  entry: 'client/main.production.js',
  dest: 'client/build.js', // output a single application bundle
  sourceMap: false,
  format: 'iife',
  onwarn: function(warning) {
    // Skip certain warnings

    // should intercept ... but doesn't in some rollup versions
    if ( warning.code === 'THIS_IS_UNDEFINED' ) { return; }

    // console.warn everything else
    console.warn( warning.message );
  },
  plugins: [
      nodeResolve({jsnext: true, module: true}),
      commonjs({
        include: [ 'node_modules/rxjs/**', 'node_modules/lodash/lodash.js' ],
        namedExports: {
          './node_modules/lodash/lodash.js': [ 'remove', 'uniqueId', 'xor', 'isNumber', 'differenceWith', 'differenceBy', 'isNil', 'clone', 'cloneDeep', 'isEqual', 'clamp', 'findIndex', 'omit']
        }
      }),
      uglify()
  ]
};
