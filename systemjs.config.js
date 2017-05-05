/*
* @Author: aaronpmishkin
* @Date:   2016-05-19 11:43:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-04 18:31:16
*/

// =========================================================================================================================================
// This is the configuration code for SystemJS, the dynamic module loader that Angular 2.0 works with by default. Modules that are added to
// the project need to be registered here so that SystemJS knows their locations, and how to load them.
// =========================================================================================================================================


// This is a self executing anonymous function. The first set of brackets contain the function to be executed, 
// the second set execute it with the given parameters.
(function(global) {

	var paths = {
      // paths serve as alias
      'npm:': 'node_modules/'
    };

	// This is a map of package names to their locations in our project structure. This is necessary for SystemJS to know how to load packages.
	var map = {
		'client':                     				'client',
		'rxjs':                       				'node_modules/rxjs',
		'@angular':                   				'node_modules/@angular',
		'd3': 						  				'node_modules/d3/build',
		'lodash':									'node_modules/lodash',
		'@angular/core': 							'node_modules/@angular/core/bundles/core.umd.js',
		'@angular/common': 							'node_modules/@angular/common/bundles/common.umd.js',
		'@angular/compiler': 						'node_modules/@angular/compiler/bundles/compiler.umd.js',
		'@angular/platform-browser': 				'node_modules/@angular/platform-browser/bundles/platform-browser.umd.js',
		'@angular/platform-browser-dynamic': 		'node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
		'@angular/http': 							'node_modules/@angular/http/bundles/http.umd.js',
		'@angular/router': 							'node_modules/@angular/router/bundles/router.umd.js',
		'@angular/forms': 							'node_modules/@angular/forms/bundles/forms.umd.js',
		'chai': 									'node_modules/chai/chai.js',
		'chai-as-promised': 						'node_modules/chai-as-promised/lib/chai-as-promised.js',
		'superagent': 								'node_modules/superagent/superagent.js'
	};

	// Defines default extensions and files.
	var packages = {
		'test':                       { defaultExtension: 'js' },
		'rxjs':                       { defaultExtension: 'js' },
		'd3':						  { main: 'd3.js', defaultExtension: 'js' },
		'lodash': 					  { main: 'lodash.js'},
		'client': {
        	defaultExtension: 'js',
        	meta: {
          		'./*.js': {
            		loader: 'systemjs-angular-loader.js'
          		}
        	},
        	main:'main.js'
      	},
      	'rxjs': {
        	defaultExtension: 'js'
     	}
	};

	var config = {
		map: map,
		packages: packages,
		paths: paths
	};

	System.config(config);

})(this);