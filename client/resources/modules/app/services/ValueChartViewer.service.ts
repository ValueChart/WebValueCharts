/*
* @Author: aaronpmishkin
* @Date:   2017-06-07 14:21:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-08 13:43:06
*/


// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Libraries:
import * as _												from 'lodash';

// Import Application Classes:
import { ValueChartService }								from './ValueChart.service';
import { CurrentUserService }								from './CurrentUser.service';

// Import Model Classes:
import { User }												from '../../../model/User';
import { ValueChart, ChartType }							from '../../../model/ValueChart';

// Import Types:
import { UserRole }											from '../../../types/UserRole'

@Injectable()
export class ValueChartViewerService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private activeValueChart: ValueChart;

	private usersToDisplay: User[]; // Users to display in the chart
	private invalidUsers: string[]; // Users that are invalid and should not be selectable

	private userRole: UserRole;		// The role of the current user.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService)	{ }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// ====================== Methods for Managing Current User Role  ======================

	userIsCreator(username: string): boolean {
		return username === this.valueChartService.getValueChart().getCreator();
	}

	userIsMember(username: string): boolean {
		return !_.isNil(this.valueChartService.getValueChart().getUser(username));
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
		return this.userRole === UserRole.OwnerAndParticipant || this.userRole === UserRole.Participant || this.userRole === UserRole.UnsavedParticipant;
	}

	// ====================== Methods for Managing the Active ValueChart ======================

	setActiveValueChart(valueChart: ValueChart): void {
		this.activeValueChart = valueChart;
	}

	getActiveValueChart(): ValueChart {
		if (_.isNil(this.activeValueChart))
			throw 'ValueChart is not defined';

		return this.activeValueChart;
	}

	generateIndividualChart(): ValueChart {
		if (this.valueChartService.getValueChart().getType() == ChartType.Individual) {
			return this.valueChartService.getValueChart();
		} else {
			let individualChart = _.clone(this.valueChartService.getValueChart());
			individualChart.setType(ChartType.Individual);
			individualChart.setUsers([individualChart.getUser(this.currentUserService.getUsername())]);
			return individualChart;
		}
	}

	// ====================== Methods for Managing the Displayed Users ======================

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