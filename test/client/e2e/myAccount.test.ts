

// Require Node Libraries:
import * as chai 								from 'chai';
import * as chaiAsPromised 						from 'chai-as-promised';
import * as p 									from 'protractor';
import { expect } 								from 'chai';

chai.use(chaiAsPromised);

// Users need to first log in before managing their accounts
describe('My Account Page', () => {
	/*
	it('should be located at the /register resource', (done: MochaDone) => {
		p.browser.get('http://localhost:3000');
		expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/register').notify(done);
	});

	it('should login', function() {

		// Find page element
		var userNameField = p.element(p.by.name('username'));
		var userPassField = p.element(p.by.name('password'));
		var userLoginBtn = p.element(p.by.id('login-button'));

		// Fill input keys
		userNameField.sendKeys('vickytry001')
		userPassField.sendKeys('001')

		// Ensure fields contain what is entered
		expect(userNameField.getAttribute('value')).to.eventually.equal('vickytry001');
		expect(userPassField.getAttribute('value')).to.eventually.equal('001');

		// Click to sign in
		userLoginBtn.click().then(function() {
			p.browser.waitForAngular();
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
		});
	});




	// Once loggin, click 'myAccount' button to modify account details
	it('should allow users to go to account managment page', function(){
		
		var myAccBtn = p.element(p.by.id('my-account'));
		myAccBtn.click().then(function() {
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/myAccount');
		});
	});

	// Case 1: succesfully change the email.
	// 		Still at 'myAccount' page:
	// 		- Change email (without changing the password)
	// 		- Click 'Update Account Details'
	// 		- Green notification field should appear
	it('should successfully change the account\'s email address', function(){
		
		// Find page elements
		var emailField = p.element(p.by.id('email-input'));
		var updAccDtlBtn = p.element(p.by.id('createUser-button'));

		p.browser.waitForAngular();


		// Fill input keys 
		emailField.clear();
		emailField.sendKeys('vickytry002@gmail.com');
		

		// Ensure fields contain what is entered
		expect(emailField.getAttribute('value')).to.eventually.equal('vickytry002@gmail.com');

		// Click 'Update Account Details' button to update
		updAccDtlBtn.click().then(function() {
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/myAccount');
			// A green field notifying success should be displayed
			var succUpdSpan = p.element(p.by.id('success-message'));
			expect(succUpdSpan.isDisplayed()).to.eventually.be.true; // .to.be.true; & .to.equal(true);
		});

	});


	// Case 2: Fail because reenter password doesn't match
	// 		At the 'myAccount' page:
	//		- Change password (reenter does not match)
	// 		- Click 'Update Account Details'
	// 		- Red notification field should appear
	
	it('shouldn\'t update account details because passwords does not match', function(){
		
		// find page elements
		var passwordField = p.element(p.by.id('password-input'));
		var reEtrPwField = p.element(p.by.id('re-password-input'));
		var updAccDtlBtn = p.element(p.by.id('createUser-button'));

		// Fill input keys
		passwordField.clear();
		passwordField.sendKeys('002');
		reEtrPwField.clear();
		reEtrPwField.sendKeys('0002');
		
		// Ensure fields contain what is entered
		expect(passwordField.getAttribute('value')).to.eventually.equal('002');
		expect(reEtrPwField.getAttribute('value')).to.eventually.equal('0002');
		// Note that after a non-matching password is entered, the red notification will appear when you click anywhere

		// Click 'Update Account Details' button to update
		updAccDtlBtn.click().then(function() {
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/myAccount');
			// A green field notifying success should be displayed
			var succUpdSpan = p.element(p.by.id('fail-message'));
			expect(succUpdSpan.isDisplayed()).to.eventually.be.true;
		});

	});

	// Case 3: succesfully change the password.
	// 		Still at 'myAccount' page:
	// 		- Change email and password (reenter matches)
	// 		- Click 'Update Account Details'
	// 		- Green notification field should appear
	//    (note that right now the email field should be vickytry002@gmail.com)
	it('should successfully change the account\'s password', function(){
		
		// Find page elements
		var passwordField = p.element(p.by.id('password-input'));
		var reEtrPwField = p.element(p.by.id('re-password-input'));
		var updAccDtlBtn = p.element(p.by.id('createUser-button'));

		// Fill input keys 
		passwordField.clear();
		passwordField.sendKeys('002');
		reEtrPwField.clear();
		reEtrPwField.sendKeys('002');
		
		// Ensure fields contain what is entered
		expect(passwordField.getAttribute('value')).to.eventually.equal('002');
		expect(reEtrPwField.getAttribute('value')).to.eventually.equal('002');

		// Click 'Update Account Details' button to update
		updAccDtlBtn.click().then(function() {
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/myAccount');
			// A green field notifying success should be displayed
			var succUpdSpan = p.element(p.by.id('success-message'));
			expect(succUpdSpan.isDisplayed()).to.eventually.be.true; // .to.be.true; & .to.equal(true);
		});

	});

	// Log out and login to the modified account. Account info at this point:
	//	 - Username: vickytry001
	//   - Email: vickytry002@gmail.com
	//   - Password: 002
	it('should successfuly log into the modified account', function(){

		var logoutBtn = p.element(p.by.id('log-out'));

		// Click logout button and log out
		logoutBtn.click().then(function() {
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/register');
		});


		// Log into the modified account (002)

		// Find page element
		var userNameField = p.element(p.by.name('username'));
		var userPassField = p.element(p.by.name('password'));
		var userLoginBtn = p.element(p.by.id('login-button'));

		// Fill input keys
		userNameField.sendKeys('vickytry001')
		userPassField.sendKeys('002')

		// Ensure fields contain what is entered
		expect(userNameField.getAttribute('value')).to.eventually.equal('vickytry001');
		expect(userPassField.getAttribute('value')).to.eventually.equal('002');

		// Click to sign in
		userLoginBtn.click().then(function() {
			p.browser.waitForAngular();
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
		});

	
	});


	// Change the account info to the original:
	//   - Username: vickytry001
	//   - Email; vickytry001@gmail.com
	//   - Password: 001
	after(function() {
		var myAccBtn = p.element(p.by.id('my-account'));

		myAccBtn.click().then(() => {

				var passwordField = p.element(p.by.id('password-input'));
				var reEtrPwField = p.element(p.by.id('re-password-input'));
				var updAccDtlBtn = p.element(p.by.id('createUser-button'));
				var emailField = p.element(p.by.id('email-input'));

				p.browser.waitForAngular();

				passwordField.clear().then(() => {
					passwordField.clear();
					passwordField.sendKeys('001');
				});

				reEtrPwField.clear().then(() => {
					reEtrPwField.sendKeys('001');
				});

				emailField.clear().then(() => {
					emailField.sendKeys('vickytry001@gmail.com');
				});

				updAccDtlBtn.click()
				p.browser.waitForAngular();
		});
	});

	*/
});
	


	

	

