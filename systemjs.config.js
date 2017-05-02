/*
* @Author: aaronpmishkin
* @Date:   2016-05-19 11:43:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-01 17:12:05
*/

// =========================================================================================================================================
// This is the configuration code for SystemJS, the dynamic module loader that Angular 2.0 works with by default. Modules that are added to
// the project need to be registered here so that SystemJS knows their locations, and how to load them.
// =========================================================================================================================================


// This is a self executing anonymous function. The first set of brackets contain the function to be executed, 
// the second set execute it with the given parameters.
(function(global) {

	// This is a map of package names to their locations in our project structure. This is necessary for SystemJS to know how to load packages.
	var map = {
		'client':                     				'client',
		'rxjs':                       				'node_modules/rxjs',
		'@angular':                   				'node_modules/@angular',
		'd3': 						  				'node_modules/d3/build',
		'supertest': 				  				'node_modules/supertest',
		'@angular/core': 							'node_modules/@angular/core/bundles/core.umd.js',
		'@angular/common': 							'node_modules/@angular/common/bundles/common.umd.js',
		'@angular/compiler': 						'node_modules/@angular/compiler/bundles/compiler.umd.js',
		'@angular/platform-browser': 				'node_modules/@angular/platform-browser/bundles/platform-browser.umd.js',
		'@angular/platform-browser-dynamic': 		'node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
		'@angular/http': 							'node_modules/@angular/http/bundles/http.umd.js',
		'@angular/router': 							'node_modules/@angular/router/bundles/router.umd.js',
		'@angular/forms': 							'node_modules/@angular/forms/bundles/forms.umd.js'
	};

	// Defines default extensions and files.
	var packages = {
		'client':                     { main: 'main.js',  defaultExtension: 'js' },
		'test':                       { defaultExtension: 'js' },
		'rxjs':                       { defaultExtension: 'js' },
		'd3':						  { main: 'd3.js', defaultExtension: 'js' }
	};

	var config = {
		map: map,
		packages: packages
	};

	System.config(config);

})(this);