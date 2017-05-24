/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 17:05:12
* @Last Modified by:   alexp
* @Last Modified time: 2017-05-24 13:29
*/

// Require Node Libraries:
import * as chai 								from 'chai';
import * as chaiAsPromised 						from 'chai-as-promised';
import * as p 									from 'protractor';
import { expect } 								from 'chai';

chai.use(chaiAsPromised);

describe('Register Page', () => {

	it('should be located at the /register resource', (done: MochaDone) => {
		p.browser.get('http://localhost:3000');
		expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/register').notify(done);
	});

	it('should login', function() {

		//Find page element
		var userNameField = p.browser.element(p.By.name('username'));
		var userPassField = p.browser.element(p.By.name('password'));
		var userLoginBtn = p.browser.element(p.By.id('login-button'));

		//Fill input keys
		userNameField.sendKeys('amishkin')
		userPassField.sendKeys('temp')

		//Ensure fields contain what is entered
		expect(userNameField.getAttribute('value')).to.eventually.equal('amishkin');
		expect(userPassField.getAttribute('value')).to.eventually.equal('temp');

		//Click to sign in
		userLoginBtn.click().then(function() {
			//p.browser.waitForAngular();
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
		});
	});

	it('should logout', function() {

		var logoutBtn = p.browser.element(p.By.id('log-out'));

		logoutBtn.click().then(function() {

			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/register');
		});

	}); 

	it('should fail to login', function() {

		//p.browser.get('http://localhost:3000/register'); //Need to return to the register page

		var userName = p.browser.element(p.By.name('username'));
		var userPass = p.browser.element(p.By.name('password'));
		var userLoginBtn = p.browser.element(p.By.id('login-button'));
		var errorMessage = p.browser.element(p.By.className('alert alert-danger'));
		//Fill input keys
		userName.sendKeys('user')
		userPass.sendKeys('pass')

		//Ensure fields contain what is entered
		expect(userName.getAttribute('value')).to.eventually.equal('user');
		expect(userPass.getAttribute('value')).to.eventually.equal('pass');

		//Click to sign in
		userLoginBtn.click().then(function() {
			//p.browser.waitForAngular();
			expect(errorMessage.isDisplayed());
		});
	});

	it('should allow users to continue as a temporary user', function() {

		var tempUser= p.browser.element(p.By.id('continue-button'));
		var tempModal = p.browser.element(p.By.id('temporary-user-modal'));

		tempUser.click().then(function() {

			expect(tempModal.isDisplayed());
		});

		var tempUserName = p.browser.element(p.By.id('temporary-name-input'));
		var tempContBtn = p.browser.element(p.By.id('temporary-user-continue'));

		tempUserName.sendKeys('tempUser')

		expect(tempUserName.getAttribute('value')).to.eventually.equal('tempUser')

		tempContBtn.click().then(function() {
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
		});

		var logoutBtn = p.browser.element(p.By.id('log-out'));

		logoutBtn.click().then(function() {

			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/register');
		});
	});

	it('should allow users to create an account', function() {

		var createAcctBtn = p.browser.element(p.By.id('create-account-button'));

		//when button is clicked want to switch state from login to createAccount
	})
});
	



















































