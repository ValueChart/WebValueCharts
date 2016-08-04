/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-04 13:59:31
*/

import { Component }										from '@angular/core';
import { ROUTER_DIRECTIVES, Router }						from '@angular/router';

// Application Classes
import { CurrentUserService }								from '../../services/CurrentUser.service';
import { UserHttpService }									from '../../services/UserHttp.service';

@Component({
	selector: 'register',
	templateUrl: 'app/resources/components/register-component/Register.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class RegisterComponent {

	private username: string;
	private password: string;
	private email: string;

	private tempUserName: string;

	private state: string;
	private invalidCredentials: boolean;

	constructor(
		private router: Router, 
		private currentUserService: CurrentUserService, 
		private userHttpService: UserHttpService) {
		this.state = 'login';
	}

	createNewUser(username: string, password: string, email: string): void {
		this.userHttpService.createNewUser(username, password, email)
			.subscribe(
				(user) => { 
					this.currentUserService.setLoggedIn(true);
					this.setUsername(username);
				},
				(error) => { this.invalidCredentials = true; } 
			);
	}

	login(username: string, password: string): void {
		this.userHttpService.login(username, password)
			.subscribe(
				(user) => {
					this.currentUserService.setLoggedIn(true);
					this.setUsername(username);
				},
				(error) => { this.invalidCredentials = true; }
			);
	}

	continueAsTempUser(username: string): void {
		(<any> $('#close-temporary-user-modal')).click();
		this.currentUserService.setLoggedIn(false);
		this.setUsername(username);
	}


	setUsername(username: string): void {
		this.currentUserService.setUsername(username);
		this.router.navigate(['create']);
	}


}
