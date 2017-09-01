/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 09:48:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-31 17:49:49
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
	del = 			require("del"),
	emitStream = 	require("emit-stream"),
	Server = 		require("karma").Server;
	rename = 		require("gulp-rename");

// Retrieve the protractor and webdriver objects from gulp-
var webdriver_standalone = pt.webdriver_standalone;
var protractor = pt.protractor;

// Create TypeScript projects for compiling the different components of the project.
var tsClient = ts.createProject("tsconfig.json");
var tsServer = ts.createProject("tsconfig.json");
var tsWebValueCharts = ts.createProject("tsconfig.json");
var tsTests = ts.createProject("tsconfig.json");

var server;
var compileTask;

// Compile the project source code. This does NOT include the project tests.
compileSource = function() {
	var clientOutput = gulp.src(['client/**/*.ts']).pipe(sourcemaps.init()).pipe(tsClient());
	var serverOutput = gulp.src(['server/**/*.ts']).pipe(sourcemaps.init()).pipe(tsServer());
	var WVCOutput = gulp.src(['WebValueCharts.ts']).pipe(sourcemaps.init()).pipe(tsWebValueCharts());

	// Merge the streams from the three compilations so that the process terminates when the last compilation is finished.
	compileTask =  merge([
				clientOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('client')), 
				serverOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('server')), 
				WVCOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('.'))]);

	return compileTask;
}

// Compile the test source code. This does NOT include the project tests.
compileTests = function() {
	var testOutput = gulp.src(['test/**/*.ts']).pipe(sourcemaps.init()).pipe(tsTests());
	return testOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('test'));
}

// Start a local server in watch mode.
startServer = function() {
    server = nodemon({
        script: 'WebValueCharts.js',
        watch: ['WebValueCharts.js']
    });

    return server;
}

// Execute Mocha unit tests.
unit = function(done) {
	var server = new Server({ configFile: __dirname + '/karma.conf.js' }, done);
	server.start();

	var stream = emitStream(server);
	stream.once('end', () => { console.log('Unit tests completed.')});

	return stream;
}

// Execute protractor end-to-end tests.
e2e = function() {
	return gulp.src(["test/client/e2e/**/*.js"])
	    .pipe(protractor({
	        configFile: "protractor.conf.js"
	    }))
	    .on('error', function(e) { throw e });
}

serverTests = function() {
	return gulp.src(['test/server/**/*.js'], { read: false })
		.pipe(mocha({
	  		reporter: "mochawesome",
	 		reporterOptions: {
				reportDir: 'test/reports',
				reportFilename: 'server-report'
			}
		}))
		.once('error', () => {
			process.exit(1);
		});
}


// runTests is a wrapper that starts up a local server before executing
// the passed-in function and then shuts the server down afterwards.
runTests = function(tests) {
	gulp.src('./server/db.address.js').pipe(rename('db.prod.js')).pipe(gulp.dest('./server'));
	gulp.src('./server/db.test.js').pipe(rename('db.address.js')).pipe(gulp.dest('./server'));

	var serverStream = startServer();

	return tests().once('end', () => {

		console.log('Shutting down local server.');
		serverStream.emit('quit');			
		process.exit();
	});
}

// Definition of gulp tasks:
// Start a standalone instance of webdriver.
gulp.task('webdriver_standalone', webdriver_standalone);

// ====== Testing Tasks ======

// Execute unit tests. Assumes pre-compilation of project source and a running local server.
gulp.task('unit', ['compile:tests'], unit)
// Executes end-to-end tests. Assumes pre-compilation of project source and a running local server.
gulp.task('e2e', ['compile:tests'], e2e)
// Executes server-side unit tests. Assumes pre-compilation of project source and a running local server.
gulp.task('server', ['compile:tests'], serverTests)
// Executes unit tests after compiling tests and source; starts its own local server.
gulp.task('test:unit', ['compile'], unit);
// Executes end-to-end tests after compiling tests and source; starts its own local server.
gulp.task('test:e2e', ['compile'], () => { return runTests(e2e); });
// Execute server tests after compiling tests and source; starts its own local server.
gulp.task('test:server', ['compile'], () => { return runTests(serverTests); });
// Execute all tests after compiling tests and source; starts its own local server.
gulp.task('test', ['test:unit'], () => { return runTests(() => { return merge([e2e(), serverTests()]); }); });


// ====== Compilation Tasks ======
// Compile the project tests.
gulp.task('compile:tests', compileTests);
// Compile the project source code. Does NOT include tests.
gulp.task('compile:source', compileSource);
// Compile the project source and then watch for changes. Recompile when changes are detected.
gulp.task('watch', function() {
    gulp.watch(['client/**/*.ts', 'server/**/*.ts', 'WebValueCharts.ts'], (event) => {
    		if (compileTask._readableState.ended) {
    			console.log('Recompiling source due to changes.');
    			compileTask = compileSource().once('end', () => { server.emit('restart'); });
    		}

    		return compileTask;
    	});
});
// Compile the entire project - both source code and tests.
gulp.task('compile', ['compile:source', 'compile:tests'])


// ====== Local Server Tasks ======

// Start a local server in watch mode after compiling the project source code.
gulp.task('start', ['watch', 'compile:source'], startServer);
// ^^ as above, just with the default 'gulp' command.
gulp.task('default', ['start']);



