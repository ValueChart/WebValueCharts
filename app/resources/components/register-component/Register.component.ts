/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-20 12:47:23
*/

// Import Angular Classes:
import { Component }										from '@angular/core';
import { ROUTER_DIRECTIVES, Router }						from '@angular/router';

// Import Application Classes:
import { CurrentUserService }								from '../../services/CurrentUser.service';
import { UserHttpService }									from '../../services/UserHttp.service';

@Component({
	selector: 'register',
	templateUrl: 'app/resources/components/register-component/Register.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class RegisterComponent {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private username: string;
	private password: string;
	private rePassword: string;
	private email: string;

	private tempUserName: string;

	private state: string;
	private invalidCredentials: boolean;
	private invalidMessage: string;


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService,
		private userHttpService: UserHttpService) {
		this.state = 'login';
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	createNewUser(username: string, password: string, email: string): void {
		this.userHttpService.createNewUser(username, password, email)
			.subscribe(
			(user) => {
				this.currentUserService.setLoggedIn(true);
				this.setUsername(username);
			},
			(error) => {
				this.invalidMessage = 'That username is not available';
				this.invalidCredentials = true;
			}
			);
	}

	login(username: string, password: string): void {
		this.userHttpService.login(username, password)
			.subscribe(
			(user) => {
				this.currentUserService.setLoggedIn(true);
				this.setUsername(username);
			},
			(error) => {
				this.invalidMessage = 'That username is not available';
				this.invalidCredentials = true;
			}
			);
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

	continueAsTempUser(username: string): void {
		$('#temporary-user-modal').modal('hide');
		this.currentUserService.setLoggedIn(false);
		this.setUsername(username);
	}

	getRedirectRoute(): string[] {

		// If the user is joining a chart, then navigate to createValueChart
		if (this.currentUserService.isJoiningChart()) {
			return ['createValueChart/newUser/ScoreFunctions'];
		} else {	// Else, navigate to the create page as normal
			return ['home'];
		}
	}


	setUsername(username: string): void {
		let navigationExtras = {
			preserveQueryParams: true,
			preserveFragment: true
		};

		this.currentUserService.setUsername(username);

		this.router.navigate(this.getRedirectRoute(), navigationExtras);
	}


}
