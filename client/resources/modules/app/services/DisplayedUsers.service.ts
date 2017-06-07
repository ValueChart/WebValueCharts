/*
* @Author: aaronpmishkin
* @Date:   2017-06-07 14:21:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-07 15:07:54
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

	private usersToDisplay: User[];

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private valueChartService: ValueChartService) {

		this.setUsersToDisplay(this.valueChartService.getValueChart().getUsers());
	}


	getUsersToDisplay(): User[] {
		return this.usersToDisplay;
	}

	setUsersToDisplay(users: User[]): void {
		this.usersToDisplay = _.clone(users);
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

	isUserDisplayed(userToFind: User) {
		var userIndex: number = this.usersToDisplay.findIndex((user: User) => {
			return userToFind.getUsername() === user.getUsername();
		});

		return userIndex !== -1;
	}

}