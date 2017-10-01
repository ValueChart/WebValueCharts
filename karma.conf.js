module.exports = function(config) {

  var appBase    = 'client/';       // transpiled app JS and map files
  var appSrcBase = appBase;      // app source TS files

  // Testing helpers (optional) are conventionally in a folder called `testing`
  var testingBase    = 'test/client/unit/'; // transpiled test JS and map files
  var testingSrcBase = 'test/client/unit/'; // test source TS files

  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],

    plugins: [
      require('karma-chrome-launcher'),
      require('karma-htmlfile-reporter'),
      require('karma-mocha'),
      // require('karma-chai-as-promised'),
      require('karma-chai')
    ],

    client: {
      builtPaths: [appBase, testingBase], // add more spec base paths as needed
      clearContext: false
    },

    customLaunchers: {
      // From the CLI. Not used here but interesting
      // chrome setup for travis CI using chromium
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    files: [
      // System.js for module loading
      'node_modules/systemjs/dist/system.src.js',

      // Polyfills
      'node_modules/core-js/client/shim.js',

      // zone.js
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/long-stack-trace-zone.js',
      'node_modules/zone.js/dist/proxy.js',
      'node_modules/zone.js/dist/sync-test.js',
      'node_modules/zone.js/dist/async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',
      'node_modules/zone.js/dist/mocha-patch.js',

      // RxJs
      { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false },
      { pattern: 'node_modules/rxjs/**/*.js.map', included: false, watched: false },

      // Paths loaded via module imports:
      // Angular itself
      { pattern: 'node_modules/@angular/**/*.js', included: false, watched: false },
      { pattern: 'node_modules/@angular/**/*.js.map', included: false, watched: false },
      { pattern: 'node_modules/traceur/bin/traceur.js', included:false, watched: false },
      { pattern: 'node_modules/lodash/lodash.js', included:false, watched: false },
      { pattern: 'node_modules/d3/build/d3.js', included:false, watched: false },
      { pattern: 'node_modules/sinon/pkg/sinon.js', included:false, watched: false },
      
      { pattern: 'systemjs.config.js', included: false, watched: false },
      { pattern: 'systemjs-angular-loader.js', included: false, watched: false },
      'karma-test-shim.js', // optionally extend SystemJS mapping e.g., with barrels

      // transpiled application & spec code paths loaded via module imports
      { pattern: appBase + '**/*.js', included: false, watched: false },      
      { pattern: testingBase + '**/*.js', included: false, watched: false },
      { pattern: 'test/testData/**.js', included: false, watched: false },
      { pattern: 'test/utilities/**.js', included: false, watched: false },
      'client/styles/main.css',

      // Asset (HTML & CSS) paths loaded via Angular's component compiler
      // (these paths need to be rewritten, see proxies section)
      { pattern: appBase + '**/*.html', included: false, watched: false },
      { pattern: appBase + '**/*.css', included: false, watched: false },

      // Paths for debugging with source maps in dev tools
      { pattern: appBase + '**/*.ts', included: false, watched: false },
      { pattern: appBase + '**/*.js.map', included: false, watched: false },
      { pattern: testingSrcBase + '**/*.ts', included: false, watched: false },
      { pattern: testingBase + '**/*.js.map', included: false, watched: false}
    ],

    // Proxied base paths for loading assets
    proxies: {
      // required for modules fetched by SystemJS
      '/base/client/node_modules/': '/base/node_modules/'
    },

    exclude: [],
    preprocessors: {},
    reporters: ['progress', 'html'],

    htmlReporter: {
      outputFile: 'test/reports/client-unit-report.html'
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    singleRun: true
  })
}
