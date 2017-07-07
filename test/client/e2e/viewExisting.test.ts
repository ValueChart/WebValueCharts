

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
	// 		- chartname: ThisIsATestChart
	// 		- password: temp
	it('should successfully let users view an individual ValueChart', function() {
			
			// Find page elements
			var vcNameField = p.browser.element(p.By.id('chart-name-input'));
			var passwordField = p.browser.element(p.By.id('chart-passsword-input'));

			// Fill input keys
			vcNameField.clear();
			vcNameField.sendKeys('ThisIsATestChart');
			passwordField.clear();
			passwordField.sendKeys('temp');

			// Ensure fields contain what is entered
			expect(vcNameField.getAttribute('value')).to.eventually.equal('ThisIsATestChart');
			expect(passwordField.getAttribute('value')).to.eventually.equal('temp');
			
			// Click "Continue" to view value chart "Cities"
			let continueBtn = p.element.all(p.by.buttonText('Continue'));
			continueBtn.click().then(function() {	
				p.browser.waitForAngular();
				expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/ValueCharts/ThisIsATestChart/0?password=temp&role=0');
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
					expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/ValueCharts/Cities/1?password=australia&role=0');
					
					// Why are we expecting the invalid users dialog to appear?

					// Expecting "Invalid Users" pop-up dialog
					// var InvldUsrDialog = p.browser.element(p.by.cssContainingText('#modal-header', 'Invalid Users'));
					// p.browser.sleep(1000);
					// expect(InvldUsrDialog.isDisplayed()).to.eventually.be.true;
					// expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/ValueCharts/Cities/1/0?password=australia');
				});	

				// See above comment.

				// var peripheralArea = p.browser.element(p.by.id('validate-modal'));
				// peripheralArea.click().then(function() {
				// 	p.browser.waitForAngular();
				// 	expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/ValueCharts/Cities/1/0?password=australia');
				// 	// Expecting "Invalid Users" pop-up dialog to disappear
				// 	var InvldUsrDialog = p.browser.element(p.by.cssContainingText('#modal-header', 'Invalid Users'));
				// 	p.browser.sleep(1000);
				// 	expect(InvldUsrDialog.isDisplayed()).to.eventually.be.false;
				// });	

			});

	});

	// The following test cases are to check whether a user can 
	// 		interact with a chart in the following situations:
	//      - Type 1:   A group chart that I don't own	
	// 		- Type 2:   A group chart that I own
	//		- Type 3:   An individual chart that I don't own
	// 		- Type 4:   An individual chart that I own, and I'm the current user
	// 		- Type 4*:  An individual chart that I own, but someone else is the current user
	// Note that I can only change my preferences in Type 4. 


    //  Case 5: see Type 1
    // 		- Currently still viewing 'Cities' so don't need to go back 
	it('shouldn\'t let users change preference when viewing a group ValueChart they don\'t own', function() {


		// Check if editing-related buttons are present or not (they should not)
		var editPreferences = p.browser.element(p.By.buttonText('Edit Preferences')); // both 'Edit ValueChart' and 'Edit Preference' buttons
		var editValueChart = p.browser.element(p.By.buttonText('Edit ValueChart'));
		var lockChartBtn = p.browser.element(p.By.buttonText('Lock Chart'));
		var saveChartBtn = p.browser.element(p.By.buttonText('Save Chart'));

		expect(editPreferences.isPresent()).to.eventually.be.false;
		expect(editValueChart.isPresent()).to.eventually.be.false;
		expect(lockChartBtn.isPresent()).to.eventually.be.false;
		expect(saveChartBtn.isPresent()).to.eventually.be.false;

		// Check if users are able to drag and drop (they should not)
		var divider1 = p.browser.element(p.by.id('label-TotalPopulation-divider'));
		var rectangle1 = p.browser.element(p.by.id('label-TotalPopulation-outline'));
		var height1: number; 
		rectangle1.getSize().then(function(eleSize){
   			height1 = eleSize.height;
   			console.log('height: '+ height1); //eleSize is the element's size object
   			p.browser.actions().dragAndDrop(divider1, rectangle1).perform();
   			var rectangle2 = p.element(p.by.id('label-TotalPopulation-outline'));
			var height2: number; 
			rectangle2.getSize().then(function(eleSize){
	   			height2 = eleSize.height;
	   			console.log('new height: '+ height2); //eleSize is the element's size object
	  			expect(height1).to.equal(height2);
	        });	
        });	

		
	});


    //  Case 6: see Type 2
    // 		- Using ValueChart StudyArea 
	it('should let users change preference when viewing an individual ValueChart they own', function() {

		// Go back to the home page
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

			// Log into Chart StudyArea:
			//		- Name: StudyArea
			//		- Password: study
			var vcNameField = p.browser.element(p.By.id('chart-name-input'));
			var passwordField = p.browser.element(p.By.id('chart-passsword-input'));

			vcNameField.clear();
			vcNameField.sendKeys('StudyArea');
			passwordField.clear();
			passwordField.sendKeys('study');

			expect(vcNameField.getAttribute('value')).to.eventually.equal('StudyArea');
			expect(passwordField.getAttribute('value')).to.eventually.equal('study');
			
			let continueBtn = p.element.all(p.by.buttonText('Continue'));
			continueBtn.click().then(function() {
				p.browser.waitForAngular();	
				expect(p.browser.getCurrentUrl()).to.eventually.equal('http://localhost:3000/ValueCharts/StudyArea/1?password=study&role=0');
			});

			// Check if the editing-related buttons are present or not
			var editPreferences = p.browser.element(p.By.buttonText('Edit Preferences')); // both 'Edit ValueChart' and 'Edit Preference' buttons
			var editValueChart = p.browser.element(p.By.buttonText('Edit ValueChart'));
			var lockChartBtn = p.browser.element(p.By.buttonText('Lock Chart'));
			var saveChartBtn = p.browser.element(p.By.buttonText('Save Chart'));

			expect(editPreferences.isPresent()).to.eventually.be.false;
			expect(editValueChart.isPresent()).to.eventually.be.false;
			expect(lockChartBtn.isPresent()).to.eventually.be.false;
			expect(saveChartBtn.isPresent()).to.eventually.be.false;
		});

		// Check if users are able to drag and drop (they should be)
		// var divider1 = p.browser.element(p.by.id('label-TotalPopulation-divider'));
		// var rectangle1 = p.browser.element(p.by.id('label-TotalPopulation-outline'));
		// var height1; 
		// rectangle1.getSize().then(function(eleSize){
  //  			height1 = eleSize.height;
  //  			console.log('height: '+ height1); //eleSize is the element's size object
  //  			p.browser.actions().dragAndDrop(divider1, rectangle1).perform();
  //  			var rectangle2 = element(by.id('label-TotalPopulation-outline'));
		// 	var height2; 
		// 	rectangle2.getSize().then(function(eleSize){
	 //   			height2 = eleSize.height;
	 //   			console.log('new height: '+ height2); //eleSize is the element's size object
	 //  			expect(height1).to.equal(height2);
	 //        });	
  //       });	

		
	});

	// Case 7: See Type 3
	// it('allows users to change preferences when viewing their own individual chart and that they are the only current user', function(){

	// }

});

	


	

	

