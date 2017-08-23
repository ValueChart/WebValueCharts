/*
* @Author: aaronpmishkin
* @Date:   2016-08-04 16:30:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-13 12:28:49
*/

import { Component } 												from '@angular/core';
import { OnInit }													from '@angular/core';
import { Router }													from '@angular/router';

// Application classes
import { CurrentUserService }										from '../../services';
import { UserHttp }											from '../../http';

/*
	This component implements the My Account page. It allows authenticated (i.e. signed in) users to modify their 
	account's email and password. Users are NOT allowed to modify their username. It uses the the userHttp to
	communicate with the server and change user account details.
*/

@Component({
	selector: 'account',
	templateUrl: './Account.template.html',
})
export class AccountComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public username: string = this.currentUserService.getUsername();
	public password: string;
	public rePassword: string;
	public email: string;


	public invalidCredentials: boolean;
	public invalidMessage: string;
	public credentialsUpdated: boolean;

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
		private userHttp: UserHttp) { }

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
		this.userHttp.getUser(this.username)
			.subscribe(user => {
				this.password = user.password;
				this.rePassword = user.password;
				this.email = user.email;
			});
	}

	updateUser(username: string, password: string, email: string): void {
		this.validatePasswords(this.password, this.rePassword);
		if (this.invalidCredentials)
			return;

		this.userHttp.updateUser(username, password, email)
			.subscribe(user => { this.credentialsUpdated = true; });
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