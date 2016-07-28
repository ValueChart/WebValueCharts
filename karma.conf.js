/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-27 18:23:46
*/

// Karma configuration
// Generated on Tue May 24 2016 09:31:07 GMT-0700 (PDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    plugins: ['karma-systemjs', 'karma-mocha', 'karma-chai', 'karma-chrome-launcher'],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['systemjs', 'mocha', 'chai'],


    // list of files / patterns to load in the browser
    files: [
      'app/resources/model/**/*.js',
      'app/resources/utilities/**/*.js',
      'test/**/*.js'
    ],

    transpiler: null,


    // list of files to exclude
    exclude: [
    ],

    systemjs: {
        // Path to your SystemJS configuration file 
        configFile: './systemjs.config.js',
     
        // Patterns for files that you want Karma to make available, but not loaded until a module requests them. eg. Third-party libraries. 
        serveFiles: [
            'node_modules/**/*'
        ],
    },

    preprocessors: { },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
