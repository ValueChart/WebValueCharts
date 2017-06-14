

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
			p.browser.waitForAngular();

			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
		});
	});


	// Once loggin, click 'View Existing ValueChart' button
	// Case 1: View a ValueChart that doesn't exist. Used:
	// 		- chartname: Null
	// 		- password: 0
	it('should fail to let users view a non-existing chart', function() {
		
		// Click "View Existing ValueChart" button, triggering a pop-up dialog
		var viewExistBtn = p.browser.element(p.By.buttonText('View Existing ValueChart'));
		viewExistBtn.click().then(function() {
			var viewExistDialog = p.browser.element(p.by.cssContainingText('#modal-header', 'View Existing Chart'));
			p.browser.sleep(5000);
			expect(viewExistDialog.isDisplayed()).to.eventually.be.true;
		});

		// Find page elements
		var vcNameField = p.browser.element(p.By.id('chart-name-input'));
		var passwordField = p.browser.element(p.By.id('chart-passsword-input'));

		// Fill input keys
		vcNameField.sendKeys('Null')
		passwordField.sendKeys('0')

		// Ensure fields contain what is entered
		expect(vcNameField.getAttribute('value')).to.eventually.equal('Null');
		expect(passwordField.getAttribute('value')).to.eventually.equal('0');	
		
		// Click to view value chart "Cities"
		let continueBtn = p.element.all(p.by.buttonText('Continue'));	
		continueBtn.click().then(function() {
			p.browser.waitForAngular();
			// Notification "Invalid Name or Password" appears
			var InvalidNameOrPwSpan = p.browser.element(p.By.cssContainingText('.col-sm-offset-4','Invalid Name or Password'));
			expect(InvalidNameOrPwSpan.isDisplayed()).to.eventually.be.true; 
			expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
		});


	});

	// Case 2: Attempt to view using wrong name/password combination
	// 		- chartname: Cities
	// 		- password: 0 (wrong)
	it('should\'nt let user view a chart with wrong password', function() {
			
			// Find page elements
			var vcNameField = p.browser.element(p.By.id('chart-name-input'));
			var passwordField = p.browser.element(p.By.id('chart-passsword-input'));

			// Fill input keys
			vcNameField.clear();
			vcNameField.sendKeys('Cities');
			passwordField.clear();
			passwordField.sendKeys('0');

			// Ensure fields contain what is entered
			expect(vcNameField.getAttribute('value')).to.eventually.equal('Cities');
			expect(passwordField.getAttribute('value')).to.eventually.equal('0');
			
			// Click "Continue" to view value chart "Cities"
			let continueBtn = p.element.all(p.by.buttonText('Continue'));
			continueBtn.click().then(function() {
				p.browser.waitForAngular();
				expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
			});
	});



	// Case 3: Successfully viewing an individual ValueChart that you don't own
	// 		- chartname: testemp
	// 		- password: t
	it('should successfully let users view an individual ValueChart', function() {
			
			// Find page elements
			var vcNameField = p.browser.element(p.By.id('chart-name-input'));
			var passwordField = p.browser.element(p.By.id('chart-passsword-input'));

			// Fill input keys
			vcNameField.clear();
			vcNameField.sendKeys('testemp');
			passwordField.clear();
			passwordField.sendKeys('t');

			// Ensure fields contain what is entered
			expect(vcNameField.getAttribute('value')).to.eventually.equal('testemp');
			expect(passwordField.getAttribute('value')).to.eventually.equal('t');
			
			// Click "Continue" to view value chart "Cities"
			let continueBtn = p.element.all(p.by.buttonText('Continue'));
			continueBtn.click().then(function() {	
				p.browser.waitForAngular();
				expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/view/testemp');
			});

	});



	// Case 4: Successfully viewing a group ValueChart (in this case you don't own)
	// 		- chartname: Cities
	// 		- password: australia
	it('should successfully let users view a group ValueChart', function() {

			// Go back to the home page first
			var vcHomeHypertext = p.browser.element(p.By.cssContainingText('.navbar-brand', 'ValueCharts'));
			vcHomeHypertext.click().then(function() {	
				expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/home');
			});

			// Click "View Existing ValueChart" button, triggering a pop-up dialog
			var viewExistBtn = p.browser.element(p.By.buttonText('View Existing ValueChart'));
			viewExistBtn.click().then(function() {
				var viewExistDialog = p.browser.element(p.by.cssContainingText('#modal-header', 'View Existing Chart'));
				p.browser.sleep(1000);
				expect(viewExistDialog.isDisplayed()).to.eventually.be.true;
		});

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
			
			// Click "Continue" to view value chart "Cities"
			let continueBtn = p.element.all(p.by.buttonText('Continue'));
			continueBtn.click().then(function() {
				p.browser.waitForAngular();
				expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/view/Cities');
			});	
	});

	// The following test cases are to check whether a user can 
	// 		interact with a chart in the following situations:
	// 		- Type 1: A group chart that I own or don't own
	//		- Type 2: An individual chart that I don't own
	// 		- Type 3: An individual chart that I own, and I'm the current user
	// 		- Type 4: An individual chart that I own, but someone else is the current user
	// Note that I can only change my preferences in case 3. 


    //  Case 5: User shoudn't be able to change preference in a group chart (Type 1)
    // 		- Currently still viewing Cities so don't need to go back 
	it('shouldn\'t let user change preference when viewing a group ValueChart', function() {

		// var editValueChartBtn = p.browser.element(p.by.cssContainingText('.form-group.valuechart-toolbar-group.pull-left','Edit ValueChart'));
		// var editValueChartBtn = p.browser.element(p.by.css('.form-group.valuechart-toolbar-group.pull-left .btn.btn-default'));
		//driver.findElement(By.cssSelector("a[href*='long']"))
		// var editValueChartBtn = p.browser.element(p.by.cssContainingText('valuechart-toolbar','Edit ValueChart'));		
		//var editValueChartBtn = p.browser.element(p.by.css('form-group.valuechart-toolbar-group.pull-left'));
		//let editValueChartBtn = p.element.all(p.by.buttonText(''));

		//expect(editValueChartBtn.isDisplayed()).to.eventually.be.false;
		var logoutBtn = p.browser.element(p.By.id('log-out'));
		expect(logoutBtn.isDisplayed()).to.eventually.be.true;
			
	});

});

	


	

	

