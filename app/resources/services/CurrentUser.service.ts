/*
* @Author: aaronpmishkin
* @Date:   2016-06-15 18:28:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-10 15:29:11
*/

import { Injectable } 												from '@angular/core';

// This class is used to expose application-wide state to components that require it. This includes the current user's username, and the current ValueChart.

@Injectable()
export class CurrentUserService {

	private username: string; 				// The username of the current user.
	private loggedIn: boolean;
	private joiningChart: boolean;

	constructor() { }

	getUsername(): string {
		return this.username;
	}

	setUsername(username: string): void {
		this.username = username;
	}

	setJoiningChart(joiningChart: boolean): void {
		this.joiningChart = joiningChart;
	}

	setLoggedIn(loggedIn: boolean): void {
		this.loggedIn = loggedIn;
	}

	isJoiningChart(): boolean {
		return this.joiningChart;
	}

	isLoggedIn(): boolean {
		return this.loggedIn;
	}
}
