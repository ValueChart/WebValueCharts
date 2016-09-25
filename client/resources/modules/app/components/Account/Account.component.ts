/*
* @Author: aaronpmishkin
* @Date:   2016-08-04 16:30:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-09-24 15:16:26
*/

import { Component } 												from '@angular/core';
import { OnInit }													from '@angular/core';
import { Router }													from '@angular/router';

// Application classes
import { CurrentUserService }										from '../../services/CurrentUser.service';
import { UserHttpService }											from '../../services/UserHttp.service';

/*
	This component implements the My Account page. It allows authenticated (i.e. signed in) users to modify their 
	account's email and password. Users are NOT allowed to modify their username. It uses the the userHttpService to
	communicate with the server and change user account details.
*/

@Component({
	selector: 'account',
	templateUrl: 'client/resources/modules/app/components/Account/Account.template.html',
})
export class AccountComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private username: string = this.currentUserService.getUsername();
	private password: string;
	private rePassword: string;
	private email: string;


	private invalidCredentials: boolean;
	private invalidMessage: string;
	private credentialsUpdated: boolean;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private currentUserService: CurrentUserService,
		private userHttpService: UserHttpService) { }

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/* 	
		@returns {void}
		@description 	Initializes the ValueChartViewer. ngOnInit is only called ONCE by Angular. This function is thus used for one-time initialized only. 
						Calling ngOnInit should be left to Angular. Do not call it manually. All initialization logic for this component should be put in this
						method rather than in the constructor.
	*/
	ngOnInit() {
		this.userHttpService.getUser(this.username)
			.subscribe(user => {
				this.password = user.password;
				this.rePassword = user.password;
				this.email = user.email;
			});
	}

	updateUser(username: string, password: string, email: string): void {
		this.userHttpService.updateUser(username, password, email)
			.subscribe(user => { this.credentialsUpdated = true; })
	}

	validatePasswords(passwordOne: string, passwordTwo: string): void {
		if (passwordOne !== passwordTwo) {
			this.invalidMessage = 'The entered passwords do not match';
			this.invalidCredentials = true;
		} else {
			this.invalidCredentials = false;
			this.invalidMessage = '';

		}
	}


}