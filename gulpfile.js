/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 09:48:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-02 22:18:34
*/

// Import gulp packages:
var gulp = 			require("gulp"),
	sourcemaps = 	require('gulp-sourcemaps'),
	nodemon = 		require("gulp-nodemon"),
	ts = 			require("gulp-typescript"),
	mocha = 		require('gulp-mocha'),
	pt = 			require("gulp-protractor"),
	child_process = require("child_process");

// Import node packages:
var	merge = 		require("merge2"),	
	path = 			require("path"),	
	glob = 			require("glob"),
	del = 			require("del");

// Retrieve the protractor and webdriver objects from gulp-
var webdriver_standalone = pt.webdriver_standalone;
var protractor = pt.protractor;

// Create TypeScript projects for compiling the different components of the project.
var tsClient = ts.createProject("tsconfig.json");
var tsServer = ts.createProject("tsconfig.json");
var tsWebValueCharts = ts.createProject("tsconfig.json");
var tsTests = ts.createProject("tsconfig.json");

// Compile the project source code. This does NOT include the project tests.
compileSource = function() {
	var clientOutput = gulp.src(['client/**/*.ts']).pipe(sourcemaps.init()).pipe(tsClient());
	var serverOutput = gulp.src(['server/**/*.ts']).pipe(sourcemaps.init()).pipe(tsServer());
	var WVCOutput = gulp.src(['WebValueCharts.ts']).pipe(sourcemaps.init()).pipe(tsWebValueCharts());

	// Merge the streams from the three compilations so that the process terminates when the last compilation is finished.
	return merge([
				clientOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('client')), 
				serverOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('server')), 
				WVCOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('.'))]);
}

// Compile the test source code. This does NOT include the project tests.
compileTests = function() {
	var testOutput = gulp.src(['test/**/*.ts']).pipe(sourcemaps.init()).pipe(tsTests());
	return testOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('test'));
}

// Start a local server in watch mode.
startServer = function() {
    return nodemon({
        script: 'WebValueCharts.js',
        tasks: ['compile'],
        watch: ['client/**/*.ts', 'server/**/*.ts', 'WebValueCharts.ts']
    });
}

// Execute Mocha unit tests.
unit = function() {
	return gulp.src(['test/unit/**/*.js'], { read: false })
		.pipe(mocha({
	  		reporter: "mochawesome",
	 		reporterOptions: {
				reportDir: 'test/reports',
				reportFilename: 'unit-report'
			}
		}));
}

// Execute protractor end-to-end tests.
e2e = function() {
	return gulp.src(["test/e2e/*.js"])
	    .pipe(protractor({
	        configFile: "protractor.conf.js"
	    }))
	    .on('error', function(e) { throw e });
}

// runTests is a wrapper that starts up a local server before executing
// the passed-in function and then shuts the server down afterwards.
runTests = function(tests) {
	var serverStream = startServer();

	return tests().once('end', () => {
		serverStream.emit('quit');			
		process.exit();
	});
}

// Definition of gulp tasks:
gulp.task('webdriver_standalone', webdriver_standalone);
// Execute unit tests. Assumes pre-compilation and a running local server.
gulp.task('unit', ['compile:tests'], unit)
// Executes end-to-end tests. Assumes pre-compilation and a running local server.
gulp.task('e2e', ['compile:tests'], e2e)
// Executes unit tests after compiling tests and source; starts its own local server.
gulp.task('test:unit', ['compile'], () => { return runTests(unit); });
// Executes end-to-end tests after compiling tests and source; starts its own local server.
gulp.task('test:e2e', ['compile'], () => { return runTests(e2e); });
// Executes all tests after compiling tests and source; starts its own local server.
gulp.task('test', ['compile'], () => { runTests(() => { return merge([unit(), e2e()]) })});

// Compile the project tests.
gulp.task('compile:tests', compileTests);
// Compile the project source code. Does NOT include tests.
gulp.task('compile:source', compileSource);
// Compile the entire project - both source code and tests.
gulp.task('compile', ['compile:source', 'compile:tests'])

// Start a local server in watch mode after compiling the project source code.
gulp.task('start', ['compile:source'], startServer);
// ^^ as above, just with the default 'gulp' command.
gulp.task('default', ['start']);



