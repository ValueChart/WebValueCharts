/*
* @Author: aaronpmishkin
* @Date:   2016-06-15 18:28:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 17:18:45
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

/*
	This class contains all useful information about the current application-level user, which it exposes to any component, directive,
	or other service that requires it. Currently, this information is limited to the username, and login status of the current user. Many components require this class to determine
	what functionality the user should be allowed to access. The My Account page is an excellent example of this; users that are temporary and not
	logged in will not be allowed to reach this page. The application level router (app.routes.ts) also uses this service to determine whether users
	are allowed to leave the register page. The username field of this class MUST be defined before the router will allow users to view any other page 
	of application. See app.routes.ts and AuthGuard for more information about this.
*/

@Injectable()
export class CurrentUserService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private username: string; 				// The username of the current user.
	private loggedIn: boolean;				// Whether or not the current user is logged in.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================

	getUsername(): string {
		return this.username;
	}

	setUsername(username: string): void {
		this.username = username;
	}

	setLoggedIn(loggedIn: boolean): void {
		this.loggedIn = loggedIn;
	}

	isLoggedIn(): boolean {
		return this.loggedIn;
	}

}
