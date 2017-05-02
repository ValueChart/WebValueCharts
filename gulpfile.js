/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 09:48:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-02 12:38:20
*/

var gulp = require("gulp"),
	sourcemaps = require('gulp-sourcemaps');
	merge = require("merge2")
	nodemon = require("gulp-nodemon"),
	ts = require("gulp-typescript"),
	mocha = require('gulp-mocha');
	protractor = require("gulp-protractor"),
	path = require("path"),
	glob = require("glob"),
	del = require("del"),
	child_process = require("child_process");


	tsClient = ts.createProject("tsconfig.json");
	tsServer = ts.createProject("tsconfig.json");
	tsWebValueCharts = ts.createProject("tsconfig.json");

compileTypeScript = function() {
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

gulp.task('compile', compileTypeScript)
gulp.task('start', ['compile'], startServer);
gulp.task('default', ['start'], function() { });




