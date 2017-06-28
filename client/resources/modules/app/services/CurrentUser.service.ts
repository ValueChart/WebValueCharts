/*
* @Author: aaronpmishkin
* @Date:   2016-06-15 18:28:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-28 12:05:59
*/

// Import Angular Classes:
import { Injectable } 												from '@angular/core';

export enum UserRole {
	Viewer,					// The user is viewing a ValueChart. They are not permitted to edit the ValueChart or interact with it in any way.
	Joining,				// The user is joining a ValueChart but has not yet become a participant by saving their preferences.
	Participant, 			// The user is participating in a ValueChart.
	Owner,
	OwnerAndParticipant
}


/*
	This class contains all useful information about the current application-level user, which it exposes to any component, directive,
	or other service that requires it. Currently, this information is limited to the username, and login status of the current user, as well
	as whether they are joining an existing ValueChart, or potentially creating/hosting their own. Many components require this class to determine
	what functionality the user should be allowed to access. The My Account page is an excellent example of this; users that are temporary and not
	logged in will not be allowed to reach this page. The application level router (app.routes.ts) also uses this service to determine whether users
	are allowed to leave the register page. The username field of this class MUST be defined before the router will allow users to view any other page 
	of application. See app.routes.ts and AuthGuardService for more information about this.
*/

@Injectable()
export class CurrentUserService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private username: string; 				// The username of the current user.
	private loggedIn: boolean;				// Whether or not the current user is logged in.
	private owner: boolean;					// Whether or not the current user 
	private userRole: UserRole;				// The role of the current user.


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

	setUserRole(role: UserRole) {
		this.userRole = role;
	}

	getUserRole(): UserRole {
		return this.userRole;
	}

	isOwner(): boolean {
		return this.userRole === UserRole.Owner || this.userRole === UserRole.OwnerAndParticipant; 
	}

	isParticipant(): boolean {
		return this.userRole === UserRole.OwnerAndParticipant || this.userRole === UserRole.Participant || this.userRole === UserRole.Joining;
	}

	setLoggedIn(loggedIn: boolean): void {
		this.loggedIn = loggedIn;
	}

	isLoggedIn(): boolean {
		return this.loggedIn;
	}
}
