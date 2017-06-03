

// Require Node Libraries:
import * as chai 								from 'chai';
import * as chaiAsPromised 						from 'chai-as-promised';
import * as p 									from 'protractor';
import { expect } 								from 'chai';

chai.use(chaiAsPromised);

// Users need to first log in before view existing charts
describe('View Existing Chart Page', () => { 

	it('should be located at the /register resource', (done: MochaDone) => {
		p.browser.get('http://localhost:3000');
		expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/register').notify(done);
	});

	it('should login', function() {

		// Find page element
		var userNameField = p.browser.element(p.By.name('username'));
		var userPassField = p.browser.element(p.By.name('password'));
		var userLoginBtn = p.browser.element(p.By.id('login-button'));

		// Fill input keys
		userNameField.sendKeys('vickytry001')
		userPassField.sendKeys('001')

		// Ensure fields contain what is entered
		expect(userNameField.getAttribute('value')).to.eventually.equal('vickytry001');
		expect(userPassField.getAttribute('value')).to.eventually.equal('001');

		// Click to sign in
		userLoginBtn.click().then(function() {
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
		});
	});


	// Once loggin, click 'View Existing ValueChart' button
	// Case 1: View a ValueChart that doesn't exist. Used:
	// 		- chartname: Null
	// 		- password: 0
	it('should fail to let users view a non-existing chart', function() {
		
		
		var viewExistBtn = p.browser.element(p.By.buttonText('View Existing ValueChart'));

		// Click "View Existing ValueChart" button, triggering a pop-up dialog
		viewExistBtn.click().then(function() {
			var viewExistDialog = p.browser.element(p.by.cssContainingText('#modal-header', 'View Existing Chart'));

			p.browser.sleep(1000);
				
			expect(viewExistDialog.isDisplayed()).to.eventually.be.true;

			// Find page elements
			var vcNameField = p.browser.element(p.By.id('chart-name-input'));
			var passwordField = p.browser.element(p.By.id('chart-passsword-input'));

			// Fill input keys
			vcNameField.sendKeys('Null')
			passwordField.sendKeys('0')

			// Ensure fields contain what is entered
			expect(vcNameField.getAttribute('value')).to.eventually.equal('Null');
			expect(passwordField.getAttribute('value')).to.eventually.equal('0');

			// let continueBtn = $('.modal-body').all(by.buttonText('Continue')); -> This also works but found more than one.
			let continueBtn = p.element.all(by.buttonText('Continue'));

			
			// Click to view value chart "Cities"
			continueBtn.click().then(function() {
				// Notification "Invalid Name or Password" appears
				var InvalidNameOrPwSpan = p.browser.element(p.By.cssContainingText('.col-sm-offset-4','Invalid Name or Password'));
				expect(InvalidNameOrPwSpan.isDisplayed()).to.eventually.be.true; 
				expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
			});
		});


	});



	// Case 2: Successfully viewing a group ValueChart
	// 		- chartname: Cities
	// 		- password: australia
	it('should successfully let users view a group ValueChart', function() {
			
			// Find page elements
			var vcNameField = p.browser.element(p.By.id('chart-name-input'));
			var passwordField = p.browser.element(p.By.id('chart-passsword-input'));

			// Fill input keys
			vcNameField.clear();
			vcNameField.sendKeys('Cities');
			passwordField.clear();
			passwordField.sendKeys('australia');

			// Ensure fields contain what is entered
			expect(vcNameField.getAttribute('value')).to.eventually.equal('Cities');
			expect(passwordField.getAttribute('value')).to.eventually.equal('australia');

			let continueBtn = p.element.all(by.buttonText('Continue'));
			
			// Click to view value chart "Cities"
			continueBtn.click().then(function() {
				// p.browser.waitForAngular();
				// browser.sleep(1000);
				expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/view/Cities');
			});
		});


	});

});

	


	

	

