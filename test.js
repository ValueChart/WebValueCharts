/*
* @Author: aaronpmishkin
* @Date:   2016-07-28 10:47:32
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-28 10:57:27
*/

var glob = require( 'glob' )
  , path = require( 'path' );

glob.sync( './test/**/*.js' ).forEach( function( file ) {
  require( path.resolve( file ) );
});