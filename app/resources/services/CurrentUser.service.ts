/*
* @Author: aaronpmishkin
* @Date:   2016-06-15 18:28:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-04 22:04:18
*/

import { Injectable } 												from '@angular/core';

// Model Classes
import { ValueChart }												from '../model/ValueChart';
import { User }														from '../model/User';


// This class is used to expose application-wide state to components that require it. This includes the current user's username, and the current ValueChart.

@Injectable()
export class CurrentUserService {

	private username: string; 				// The username of the current user.
	private valueChart: ValueChart;
	
	public user: User;

	constructor() { }

	getUsername(): string {
		return this.username;
	}

	setUsername(username: string): void {
		this.username = username;
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;

		// Obviously we should have it so that two usernames are same.
		var user: User = valueChart.getUsers().filter((user: User) => {
			return user.getUsername() === this.username;
		})[0];

		if (user) {
			this.user = user;
		} else {
			this.user = valueChart.getUsers()[0];
		}
	}

}
