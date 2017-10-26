/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 14:59:35
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-10-25 22:00:23
*/

exports.config = {
  	seleniumServerJar: './node_modules/protractor/node_modules/webdriver-manager/selenium/selenium-server-standalone-3.6.0.jar',
  	framework: 'mocha',
  	specs: ['./test/client/e2e/**/*.js'],
  	getPageTimeout: 20000,
  	allScriptsTimeout: 60000,
  	mochaOpts: {
	 	reporter: "mochawesome",
	 	timeout: 15000,
	 	reporterOptions: {
			reportDir: 'test/reports',
			reportFilename: 'client-e2e-report'
		}
	}
};