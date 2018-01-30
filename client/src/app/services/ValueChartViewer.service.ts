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
import { HostService }										from './Host.service';

// Import Model Classes:
import { User }												from '../../model';
import { ValueChart, ChartType }							from '../../model';

// Import Types:
import { UserRole }											from '../../types';

/*
	This class stores the ValueChart that is displayed in the ValueChartViewer - this is the so called "active" ValueChart.
	The "active" ValueChart may be the same as the ValueChart in the ValueChartService (the so called "base" ValueChart", but it
	does not have to be. The ValueChartViewerService also stores state information about the user's role in the "active" ValueChart,
	the list of users that are displayed in the "active" ValueChart, and the list of users whose preferences are invalid w.r.t. 
	the "active" ValueChart.

	It is almost always the case that the "active" and "base" ValueCharts have exactly the same structure (ie. alternatives, objectives, etc)
	and only differ in their internal list of users (valueChart.users). This is because the "active" ValueChart is primarily used to allow 
	application users to swap between seeing the ValueChart with only their preferences (their individual chart) and the ValueChart with all
	users (the group chart).
*/

@Injectable()
export class ValueChartViewerService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private activeValueChart: ValueChart;				// The ValueChart currently displayed by the ValueChartViewer.
	private savedValueChartStructure: ValueChart; 		// The last saved version of the ValueChart structure (objectives and alternatives only).
														// This is used to check for structural changes made by the owner since the last save.

	private usersToDisplay: User[]; 			// Users to display in the active ValueChart. This need not be activeValueChart.users
	private invalidUsers: string[]; 			// Usernames of users that are invalid and should not displayed in the ValueChart.
												// Not that usersToDisplay MUST NOT contain any users whose names are contained here.

	private userRole: UserRole;					// The role of the current user. This determines what the user is permitted to do in the Viewer.

	// This list is drawn from Kelly's 22 Colors of Maximum Contrast. White and Black, the first two colors, have been omitted. See: http://www.iscc.org/pdf/PC54_1724_001.pdf
	public kellyColors: string[] = ['#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032', '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97', '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26'];

	private hostSubscriptions: Subscription[] = []	// A list of subscriptions to the hostService Subjects that notify of changes to activeValueChart.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private userNotificationService: UserNotificationService,
		private hostService: HostService,
		private currentUserService: CurrentUserService,
		private validationService: ValidationService,
		private valueChartService: ValueChartService)	{ 

		// Subscribe to the Subjects in the host service that notify of specific changes to the activeValueChart
		// such as users added/removed/changed and structural changes (alternatives/objectives/basic details added/removed/changed)
		this.hostSubscriptions.push(this.hostService.userAddedSubject.subscribe(this.userAdded));
		this.hostSubscriptions.push(this.hostService.userChangedSubject.subscribe(this.userChanged));
		this.hostSubscriptions.push(this.hostService.userRemovedSubject.subscribe(this.userRemoved));
		this.hostSubscriptions.push(this.hostService.structureChangedSubject.subscribe(this.structureChanged));
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/*   
	  	@returns {void}
	    @description    ngOnDestroy is only called ONCE by Angular when this service instance is no longer needed
	    				is cleaned up as a result. We must unsubscribe from the host subjects here in order
	    				to prevent a memory leak.
	*/
	ngOnDestroy() {
		this.hostSubscriptions.forEach((sub) => {
			sub.unsubscribe();
		});
	}

	// ====================== Methods for Managing Current User Role  ======================

	/*   
		@param username - the username of a user 
	  	@returns {boolean} - whether or not the given username is set as the creator of the ValueChart.
	    @description	Check to see if the user with the provided username is the owner/creator of the 
	    				current ValueChart.
	*/
	userIsCreator(username: string): boolean {
		return username === this.valueChartService.getValueChart().getCreator();
	}

	/*   
		@param username - the username of a user 
	  	@returns {boolean} - whether or not the given username belongs to a user in the ValueChart.
	    @description	Check to see if the user with the provided username is a member of the
	    				current ValueChart.
	*/
	userIsMember(username: string): boolean {
		return this.valueChartService.getValueChart().isMember(username);
	}

	/*   
		@param role - the new user role to assign to the current user.
	  	@returns {void}
	    @description	Set the current user to the have the given user role with respect to the 
	    				current ValueChart. This will control what actions the user is able to 
	    				take in the ValueChartViewer.
	*/
	setUserRole(role: UserRole): void {
		this.userRole = role;
	}

	/*   
	  	@returns {UserRole} - the current user's role.
	    @description	Get the current user's role.
	*/
	getUserRole(): UserRole {
		return this.userRole;
	}

	/*   
	  	@returns {boolean} - whether or not the current user role is an ownership role.
	    @description	Check to see if the current user role is one of ownership. This method is often used
	    				for convenience when determining user permissions.
	*/
	isOwner(): boolean {
		return this.userRole === UserRole.Owner || this.userRole === UserRole.OwnerAndParticipant; 
	}

	/*   
	  	@returns {boolean} - whether or not the current user role is a participant role (ie. the current user is a member of the current ValueChart).
	    @description	Check to see if the current user role is a participatory role. This method is often used
	    				for convenience when determining user permissions.
	*/
	isParticipant(): boolean {
		return this.userRole === UserRole.OwnerAndParticipant || this.userRole === UserRole.Participant || this.userRole === UserRole.UnsavedParticipant;
	}

	// ====================== Methods for Managing the Active ValueChart ======================

	/*   
		@param valueChart - the ValueChart to set as the activeValueChart, which will be displayed by the ValueChartViewer.
	  	@returns {void}
	    @description	Set the activeValueChart to be the ValueChart instance provided.
	*/
	setActiveValueChart(valueChart: ValueChart): void {
		this.activeValueChart = valueChart;
	}

	/*   
		@param valueChart - the ValueChart to set as the saved ValueChart structure.
	  	@returns {void}
	    @description	Set the savedValueChartStructure to be the ValueChart instance provided.
	*/
	setSavedValueChartStructure(valueChartStructure: ValueChart): void {
		this.savedValueChartStructure = valueChartStructure;
	}

	/*   
	  	@returns {ValueChart} - the active ValueChart instance.
	    @description	Get the activeValueChart. This method will throw an exception if no active ValueChart
	    				has been set.
	*/
	getActiveValueChart(): ValueChart {
		if (_.isNil(this.activeValueChart))
			throw 'ValueChart is not defined';	// The ValueChart is not defined; throw an exception.

		return this.activeValueChart;
	}

	/*   
	  	@returns {ValueChart} - the saved ValueChart structure.
	    @description	Get the savedValueChartStructure. This method will throw an exception if no ValueChart structure
	    				has been saved.
	*/
	getSavedValueChartStructure(): ValueChart {
		if (_.isNil(this.savedValueChartStructure))
			throw 'ValueChart is not defined';	// The ValueChart is not defined; throw an exception.

		return this.savedValueChartStructure;
	}

	/*   
	  	@returns {ValueChart} - an individual ValueChart obtained by removing all users but the current one from
	  							"base" ValueChart in the ValueChartService.
	    @description	Create and return a new individual ValueChart by removing all users but the current one from
	  					"base" ValueChart in the ValueChartService. If the "base" chart is already individual,
	  					then that chart is simply returned. Note that if the current user is not a member of the 
	  					"base" ValueChart, this method will return an empty individual chart.
	*/
	generateIndividualChart(): ValueChart {
		if (this.valueChartService.getValueChart().getType() == ChartType.Individual) {
			return this.valueChartService.getValueChart();		// Return the "base" chart since it is already individual.
		} else {
			let individualChart = _.clone(this.valueChartService.getValueChart());	// Create a new memory reference for the individual ValueChart.
			individualChart.setType(ChartType.Individual);
			individualChart.setUsers([individualChart.getUser(this.currentUserService.getUsername())]); // Keep only the current user.
			return individualChart;
		}
	}

	// ====================== Methods for Managing the Displayed Users ======================

	/*   
		@param users - a list of users (some may be invalid) that are to be displayed.
		@param invalidUsers - a list of usernames for the users whose preferences are invalid.
	  	@returns {void}
	    @description	Given a list of users that should be displayed and a list of invalid users,
	    				this method filters the users of invalid users, assigns colors to
	    				those users without them, and then sets the usersToDisplay and invalidUsers fields. 
	*/
	initializeUsers(users: User[], invalidUsers: string[]): void {
		let valueChart = this.valueChartService.getValueChart();

		this.usersToDisplay = _.clone(users.filter(user => invalidUsers.indexOf(user.getUsername()) === -1));
		this.setInvalidUsers(invalidUsers);
	}

	getUsersToDisplay(): User[] {
		return this.usersToDisplay;
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

		// We need to the order of usersToDisplay to remain consistent with the order of users in
		// the "base" ValueChart from the ValueChartService.
		this.sortUsersToDisplay();
	}

	/*   
	  	@returns {void} =
	    @description	Sort the users in the usersToDisplay field to have the same ordering as the users
	    				in the "base" ValueChart. This is often necessary to insure that users are visualized
	    				in the same order as they are listed in Detail Box.
	*/
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

	/*   
	  	@returns {newUser} - an new user that has already been added to the "base" ValueChart in the ValueChartService.
	    @description	This method handles events from the userAdded subject in the HostService. It adds the new user 
	    				to the usersToDisplay field as long as they are valid.
	*/
	userAdded = (newUser: User): void => {
		let errors = this.validationService.validateUser(this.valueChartService.getValueChart(), newUser);

		if (errors.length === 0)
			this.addUserToDisplay(newUser);
		else
			this.addInvalidUser(newUser.getUsername());

		if (this.userRole !== UserRole.UnsavedParticipant)
			this.userNotificationService.displayInfo([newUser.getUsername() + ' has joined the ValueChart']);
	}

	/*   
	  	@returns {updateUser} - an existing user whose preferences have been updated.
	    @description	This method handles events from the userChanged subject in the HostService. It validates the
	    				preferences of the given user and adds them to usersToDisplay as long as they are valid.
	*/
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

	/*   
	  	@returns {userToDelete} - the username of a user that has already been removed from the "base" ValueChart in the ValueChartService.
	    @description	This method handles events from the userRemoved subject in the HostService. It removes the user with the given username
	    				from the usersToDisplay field.
	*/
	userRemoved = (userToDelete: string): void => {
		this.removeUserToDisplay(userToDelete);
		this.removeInvalidUser(userToDelete);

		// Update the user role
		if (userToDelete === this.currentUserService.getUsername()) {
			let newRole = this.isOwner() ? UserRole.Owner : UserRole.Viewer;
			this.setUserRole(newRole);
		}

		if (this.userRole !== UserRole.UnsavedParticipant)
			this.userNotificationService.displayInfo([userToDelete + ' has left the ValueChart']);
	}

	/*   
	  	@returns {valueChart} - a ValueChart with an updated structure.
	    @description	This method handles events from the structureChanged subject in the HostService. It updates the activeValueChart
	    				to have the same structure as the provided ValueChart instance. It also updates the list of invalid users 
	    				and the list of usersToDisplay.
	*/
	structureChanged = (valueChart: ValueChart): void => {
		// Notify the current user of any errors in their preferences.
		if (this.userIsMember(this.currentUserService.getUsername())) {
			let errors = this.validationService.validateUser(valueChart, valueChart.getUser(this.currentUserService.getUsername()));
			this.userNotificationService.displayErrors(errors);
		}
					
		// Hide invalid users.
		let invalidUsers = this.validationService.getInvalidUsers(valueChart);
		_.remove(this.usersToDisplay, user => invalidUsers.indexOf(user.getUsername()) !== -1);

		// Show valid users (that were previously invalid).
		this.invalidUsers.filter(previouslyInvalidUser => invalidUsers.indexOf(previouslyInvalidUser) === -1).forEach(
			nowValidUser => this.addUserToDisplay(this.activeValueChart.getUser(nowValidUser)));
		
		this.setInvalidUsers(invalidUsers);

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