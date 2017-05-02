/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 14:59:35
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-02 16:28:39
*/

exports.config = {
  	seleniumServerJar: './node_modules/protractor/node_modules/webdriver-manager/selenium/selenium-server-standalone-3.4.0.jar',
  	framework: 'mocha',
  	specs: ['/test/e2e/test.spec.js'],
  	mochaOpts: {
	 	reporter: "mochawesome",
	 	reporterOptions: {
			reportDir: 'test/reports',
			reportFilename: 'e2e-report'
		}
	}
};