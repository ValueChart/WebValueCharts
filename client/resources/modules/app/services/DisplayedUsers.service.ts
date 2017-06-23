/*
* @Author: aaronpmishkin
* @Date:   2017-06-07 14:21:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-23 10:02:00
*/


// Import Angular Classes:
import { Injectable } 										from '@angular/core';


// Import Libraries:
import * as _												from 'lodash';

// Import Application Classes:
import { ValueChartService }								from './ValueChart.service';

// Import Model Classes:
import { User }												from '../../../model/User';


@Injectable()
export class DisplayedUsersService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private usersToDisplay: User[]; // Users to display in the chart
	private invalidUsers: string[]; // Users that are invalid and should not be selectable

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private valueChartService: ValueChartService) {

		this.setUsersToDisplay(_.clone(this.valueChartService.getValueChart().getUsers()));
	}

	getUsersToDisplay(): User[] {
		return this.usersToDisplay;
	}

	setUsersToDisplay(users: User[]): void {
		this.usersToDisplay = users;
	}

	setInvalidUsers(usernames: string[]): void {
		this.invalidUsers = usernames;
	}

	addUserToDisplay(newUser: User): void {
		var userIndex: number = this.usersToDisplay.findIndex((user: User) => {
			return newUser.getUsername() === user.getUsername();
		});

		if (userIndex === -1) {
			this.usersToDisplay.push(newUser);
		} else {
			this.usersToDisplay[userIndex] = newUser;
		}

		let indices: any = {};
		this.valueChartService.getValueChart().getUsers().forEach((user, i) => { indices[user.getUsername()] = i; });

		this.usersToDisplay.sort((a: User, b: User) => {
			return indices[a.getUsername()] < indices[b.getUsername()] ? -1 : 1;
		});
	}

	removeUserToDisplay(username: string): void {
		var index: number = this.usersToDisplay.findIndex((currentUser: User) => {
				return username === currentUser.getUsername();
			});
		if (index !== -1) {
			this.usersToDisplay.splice(index, 1);
		}
	}

	removeInvalidUser(username: string): void {
		var index = this.invalidUsers.indexOf(username);
		if (index !== -1) {
			this.invalidUsers.splice(index, 1);		
		}
	}

	isUserDisplayed(userToFind: User): boolean {
		var userIndex: number = this.usersToDisplay.findIndex((user: User) => {
			return userToFind.getUsername() === user.getUsername();
		});

		return userIndex !== -1;
	}

	isUserInvalid(userToFind: string): boolean {
		return this.invalidUsers.indexOf(userToFind) !== -1;
	}
}