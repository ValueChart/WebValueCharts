/*
* @Author: aaronpmishkin
* @Date:   2017-06-07 14:21:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 12:00:08
*/


// Import Angular Classes:
import { Injectable, OnDestroy } 							from '@angular/core';

// Import Libraries:
import * as _												from 'lodash';
import { Subscription }										from 'rxjs/Subscription';

// Import Application Classes:
import { UserNotificationService }							from './UserNotification.service'; 
import { ValidationService }								from './Validation.service';
import { ValueChartService }								from './ValueChart.service';
import { CurrentUserService }								from './CurrentUser.service';
import { HostHttp }											from '../http/Host.http';

// Import Model Classes:
import { User }												from '../../model';
import { ValueChart, ChartType }							from '../../model';

// Import Types:
import { UserRole }											from '../../types';

@Injectable()
export class ValueChartViewerService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private activeValueChart: ValueChart;

	private usersToDisplay: User[]; // Users to display in the chart
	private invalidUsers: string[]; // Users that are invalid and should not be selectable

	private userRole: UserRole;		// The role of the current user.

	// This list is drawn from Kelly's 22 Colors of Maximum Contrast. White and Black, the first two colors, have been omitted. See: http://www.iscc.org/pdf/PC54_1724_001.pdf
	public kellyColors: string[] = ['#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032', '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97', '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26'];

	private subs: Subscription[] = []

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private userNotificationService: UserNotificationService,
		private hostHttp: HostHttp,
		private currentUserService: CurrentUserService,
		private validationService: ValidationService,
		private valueChartService: ValueChartService)	{ 

		this.subs.push(this.hostHttp.userAddedSubject.subscribe(this.userAdded));
		this.subs.push(this.hostHttp.userChangedSubject.subscribe(this.userChanged));
		this.subs.push(this.hostHttp.userRemovedSubject.subscribe(this.userRemoved));
		this.subs.push(this.hostHttp.structureChangedSubject.subscribe(this.structureChanged));
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	ngOnDestroy() {
		this.subs.forEach((sub) => {
			sub.unsubscribe();
		});
	}

	// ====================== Methods for Managing Current User Role  ======================

	userIsCreator(username: string): boolean {
		return username === this.valueChartService.getValueChart().getCreator();
	}

	userIsMember(username: string): boolean {
		return this.valueChartService.getValueChart().isMember(username);
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

	initializeUsers(users: User[], invalidUsers: string[]): void {
		let valueChart = this.valueChartService.getValueChart();

		this.usersToDisplay = _.clone(users.filter(user => invalidUsers.indexOf(user.getUsername()) === -1));
		this.setUsersToDisplay(this.usersToDisplay);
		this.setInvalidUsers(invalidUsers);
		this.initUserColors(valueChart);
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

		this.sortUsersToDisplay();
	}

	sortUsersToDisplay(): void {
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

	addInvalidUser(username: string): void {
		if (this.invalidUsers.indexOf(username) === -1)
			this.invalidUsers.push(username);
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

	updateInvalidUser(user: User, errors: string[]): void {
		if (errors.length === 0 && this.isUserInvalid(this.currentUserService.getUsername())) {
			this.removeInvalidUser(this.currentUserService.getUsername());
			this.addUserToDisplay(user);
		} else if (errors.length > 0) {
			this.addInvalidUser(user.getUsername());
			this.removeUserToDisplay(user.getUsername());
		}
	}



	// ====================== Methods for Responding to ValueChart Changes ======================

	userAdded = (newUser: User): void => {
		let errors = this.validationService.validateUser(this.valueChartService.getValueChart(), newUser);

		if (errors.length === 0)
			this.addUserToDisplay(newUser);
		else
			this.addInvalidUser(newUser.getUsername());

		this.initUserColors(this.valueChartService.getValueChart());

		if (this.userRole !== UserRole.UnsavedParticipant)
			this.userNotificationService.displayInfo([newUser.getUsername() + ' has joined the ValueChart']);
	}

	userChanged = (updatedUser: User): void => {
		let errors = this.validationService.validateUser(this.valueChartService.getValueChart(), updatedUser);

		if (this.isUserDisplayed(updatedUser))
			this.addUserToDisplay(updatedUser);

		// If user was previously invalid, they will be valid now.
		if (errors.length === 0) {
			this.removeInvalidUser(updatedUser.getUsername());
			this.addUserToDisplay(updatedUser);
		}

		if (this.userRole !== UserRole.UnsavedParticipant)
			this.userNotificationService.displayInfo([updatedUser.getUsername() + ' has updated their preferences']);
	}

	userRemoved = (userToDelete: string): void => {
		this.removeUserToDisplay(userToDelete);
		this.removeInvalidUser(userToDelete);

		// Update the user role
		if (userToDelete === this.currentUserService.getUsername() && this.userIsMember(userToDelete)) {
			let newRole = this.isOwner() ? UserRole.Owner : UserRole.Viewer;
			this.setUserRole(newRole);
		}

		if (this.userRole !== UserRole.UnsavedParticipant)
			this.userNotificationService.displayInfo([userToDelete + ' has left the ValueChart']);
	}

	structureChanged = (valueChart: ValueChart): void => {
		// Notify the current user of any errors in their preferences.
		if (this.userIsMember(this.currentUserService.getUsername())) {
			let errors = this.validationService.validateUser(valueChart, valueChart.getUser(this.currentUserService.getUsername()));
			this.userNotificationService.displayErrors(errors);
		}
					
		// Hide invalid users.
		let invalidUsers = this.validationService.getInvalidUsers(valueChart);

		_.remove(this.usersToDisplay, user => invalidUsers.indexOf(user.getUsername()) !== -1);
		this.setInvalidUsers(invalidUsers);
		this.initUserColors(valueChart);

		// Update the active ValueChart.
		if (this.getActiveValueChart().getType() === ChartType.Individual) {
			let individualChart = this.generateIndividualChart();
			this.setActiveValueChart(individualChart);
		}
	}

	/*
		@returns {void}
		@description	Assigns a color to every user in the ValueChart that does not yet have a color. Note that users that join the ValueChart
						do not have colors, so this method must be called whenever a new user joins.

	*/
	initUserColors(valueChart: ValueChart): void {
		// Check which colors have been assigned (this is necessary because removing users may alter the indexing).
		var assignedColors: string[] = valueChart.getUsers().map(user => user.color);
		var unassignedKellyColors = this.kellyColors.filter(color => assignedColors.indexOf(color) === -1);
		// Assign first-available Kelly color to each user without one in the ValueChart
		valueChart.getUsers().forEach((user: User, index: number) => {
			if (!user.color || user.color == "#000000") {
				user.color = unassignedKellyColors.shift();
			}
		});
	}

}