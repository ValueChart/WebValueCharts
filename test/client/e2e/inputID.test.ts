/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 17:05:12
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-02 21:28:08
*/

// Require Node Libraries:
import * as chai 								from 'chai';
import * as chaiAsPromised 						from 'chai-as-promised';
import * as protractor 							from 'protractor';
import { expect } 								from 'chai';

chai.use(chaiAsPromised);

describe('Register Page', () => {

	it('should be located at the /register resource', (done: MochaDone) => {
		protractor.browser.get('http://localhost:3000');
		expect(protractor.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/register').notify(done);
	});
});