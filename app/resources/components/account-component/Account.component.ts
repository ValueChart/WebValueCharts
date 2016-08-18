/*
* @Author: aaronpmishkin
* @Date:   2016-08-04 16:30:08
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-05 11:15:44
*/

import { Component } 												from '@angular/core';
import { OnInit }													from '@angular/core';
import { Router, ROUTER_DIRECTIVES }								from '@angular/router';

// Application classes
import { CurrentUserService }										from '../../services/CurrentUser.service';
import { UserHttpService }											from '../../services/UserHttp.service';


@Component({
	selector: 'account',
	templateUrl: 'app/resources/components/account-component/Account.template.html',
	directives: [ROUTER_DIRECTIVES],
})
export class AccountComponent implements OnInit {

	private username: string = this.currentUserService.getUsername();
	private password: string;
	private rePassword: string;
	private email: string;


	private invalidCredentials: boolean;
	private invalidMessage: string;
	private credentialsUpdated: boolean;

	constructor(
		private currentUserService: CurrentUserService,
		private userHttpService: UserHttpService) { }


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