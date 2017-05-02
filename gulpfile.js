/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 09:48:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-02 16:28:04
*/

var gulp = require("gulp"),
	sourcemaps = require('gulp-sourcemaps');
	merge = require("merge2")
	nodemon = require("gulp-nodemon"),
	ts = require("gulp-typescript"),
	mocha = require('gulp-mocha');
	pt = require("gulp-protractor"),
	path = require("path"),
	glob = require("glob"),
	del = require("del"),
	child_process = require("child_process");

var webdriver_standalone = pt.webdriver_standalone;
var protractor = pt.protractor;


var tsClient = ts.createProject("tsconfig.json");
var tsServer = ts.createProject("tsconfig.json");
var tsWebValueCharts = ts.createProject("tsconfig.json");
var tsTests = ts.createProject("tsconfig.json");

compileSource = function() {
	var clientOutput = gulp.src(['client/**/*.ts']).pipe(sourcemaps.init()).pipe(tsClient());
	var serverOutput = gulp.src(['server/**/*.ts']).pipe(sourcemaps.init()).pipe(tsServer());
	var WVCOutput = gulp.src(['WebValueCharts.ts']).pipe(sourcemaps.init()).pipe(tsWebValueCharts());

	return merge([
				clientOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('client')), 
				serverOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('server')), 
				WVCOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('.'))]);
}

startServer = function() {
    return nodemon({
        script: 'WebValueCharts.js',
        tasks: ['compile'],
        watch: ['client/**/*.ts', 'server/**/*.ts', 'WebValueCharts.ts']
    });
}

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

e2e = function() {
	return gulp.src(["test/e2e/*.js"])
	    .pipe(protractor({
	        configFile: "protractor.conf.js"
	    }))
	    .on('error', function(e) { throw e });
}

runTests = function(tests) {
	var serverStream = startServer();

	return tests().once('end', () => {
		serverStream.emit('quit');			
		process.exit();
	});
}

compileTests = function() {
	var testOutput = gulp.src(['test/**/*.ts']).pipe(sourcemaps.init()).pipe(tsTests());
	return testOutput.js.pipe(sourcemaps.write()).pipe(gulp.dest('test'));
}

gulp.task('webdriver_standalone', webdriver_standalone);
gulp.task('test:unit', ['compile'], () => { return runTests(unit); });
gulp.task('test:e2e', ['compile'], () => { return runTests(e2e); });
gulp.task('test', ['compile'], () => { runTests(() => { return merge([unit(), e2e()]) })});
gulp.task('compile:tests', compileTests);
gulp.task('compile:source', compileSource);
gulp.task('compile', ['compile:source', 'compile:tests'])
gulp.task('start', ['compile:source'], startServer);
gulp.task('default', ['start']);




