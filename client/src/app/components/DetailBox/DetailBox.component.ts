/*
* @Author: aaronpmishkin
* @Date:   2017-05-15 10:25:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-19 13:13:49
*/

// Import Angular Classes:
import { Component, Input, Output }												from '@angular/core';
import { OnInit, EventEmitter }													from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';

// Import Application Classes:
import { ObjectiveChartDefinitions }											from '../../../ValueChartVis';

import { ValueChartHttp }														from '../../http';
import { HostService }															from '../../services';
import { UserNotificationService }												from '../../services';
import { ValueChartViewerService }												from '../../services';
import { CurrentUserService }													from '../../services';
import { ValueChartService }													from '../../services';
import { RenderEventsService }													from '../../../ValueChartVis';


// Import Model Classes:
import { ValueChart } 															from '../../../model';
import { PrimitiveObjective } 													from '../../../model';
import { User } 																from '../../../model';
import { Alternative } 															from '../../../model';

// Import Types:
import { ViewConfig, InteractionConfig, ChartOrientation }						from '../../../types';

/*
	The DetailBox component implements a UI widget for displaying a ValueChart's basic details, alternatives, and user list.
	It also implement several important interactions and management options for a ValueChart. These are:
		- Deleting, hiding, and reordering users.
		- Viewing alternative details.
		- Viewing a ValueCharts's basic details and generating invitation links.
	This component is currently only used by the ValueChartViewer.
*/

@Component({
	selector: 'DetailBox',
	templateUrl: './DetailBox.template.html',
	providers: []
})
export class DetailBoxComponent implements OnInit {


	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Inputs
	@Input() valueChart: ValueChart;								// The ValueChart whose details the DetailBox should display.
	@Input() chartElement: d3.Selection<any, any, any, any>;		// The base element of the ValueChart's visualization. This is required to link alternative labels to the DetailBox.
	@Input() enableManagement: boolean								// Whether or not the detail box should should management options (deleting users, etc).
	@Input() viewConfig: ViewConfig;								// The ValueChartDirective's current viewConfig object.
	@Input() showUsers: boolean;									// Whether or not the user list panel of the detail box should be displayed. It is usually hidden for individual ValueCharts.
	@Input() width: number;											// The width of the detail box.
	@Input() height: number;										// The height of the detail box.

	public detailBoxAlternativeTab: string;
	private alternativeObjectives: string[];
	private alternativeObjectiveValues: (string | number)[];

	public userToRemove: User;
	public displayModal: boolean = false;
	public actionFunction: Function;

	public detailBoxCurrentTab: string;
	public DETAIL_BOX_CHART_TAB: string = 'chart';
	public DETAIL_BOX_ALTERNATIVES_TAB: string = 'alternatives';
	public DETAIL_BOX_USERS_TAB: string = 'users';

	public ChartOrientation = ChartOrientation;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	constructor(
		private currentUserService: CurrentUserService,
		private userNotificationService: UserNotificationService,
		private valueChartHttp: ValueChartHttp,
		private hostService: HostService,
		private valueChartService: ValueChartService,
		private valueChartViewerService: ValueChartViewerService) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	ngOnInit(): void {
		this.detailBoxCurrentTab = this.DETAIL_BOX_CHART_TAB;
		this.detailBoxAlternativeTab = 'Alternatives';
		this.alternativeObjectives = [];
		this.alternativeObjectiveValues = [];
	}


	@Input() 
	set renderEventsService(renderEventsService: RenderEventsService) {
		if (renderEventsService)
			this.linkAlternativeLabelsToDetailBox();
	}


	expandAlternative(alternative: Alternative): void {
		this.detailBoxAlternativeTab = alternative.getName();
		this.detailBoxCurrentTab = this.DETAIL_BOX_ALTERNATIVES_TAB;

		this.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.alternativeObjectives[index] = objective.getName();
			this.alternativeObjectiveValues[index] = alternative.getObjectiveValue(objective.getId());
		});

	}

	collapseAlternative(): void {
		this.detailBoxAlternativeTab = 'Alternatives';
	}

	setUserColor(user: User, color: string): void {
		user.color = color;
	}

	changeDisplayedUsers(user: User, eventObject: Event): void {
		if ((<HTMLInputElement> eventObject.target).checked) {
			this.valueChartViewerService.addUserToDisplay(user);
		} else {
			this.valueChartViewerService.removeUserToDisplay(user.getUsername());
		}
	}

	displayRemoveUser(user: User): void {
		this.userToRemove = user; 
		this.actionFunction = this.removeUser.bind(this, this.userToRemove)
		this.displayModal = true; 
	}

	/* 	
		@returns {void}
		@description 	Removes a user from the existing ValueChart, and updates the ValueChart's resource on the database.
	*/
	removeUser(userToDelete: User): void {
		this.valueChartHttp.deleteUser(this.valueChart._id, userToDelete.getUsername())
			.subscribe(username => {
				if (!this.hostService.hostWebSocket) { 	// Handle the deleted user manually.

					var userIndex: number = this.valueChart.getUsers().findIndex((user: User) => {
						return user.getUsername() === userToDelete.getUsername();
					});
					// Delete the user from the ValueChart
					this.valueChart.getUsers().splice(userIndex, 1);
					this.userNotificationService.displayInfo([userToDelete.getUsername() + ' has left the ValueChart']);
				}

				// The Host connection is active, so let it handle notifications about the deleted user.
			},
			err => {
				this.userNotificationService.displayErrors([userToDelete.getUsername() + ' could not be deleted']);
			});
	}

	moveUserUp(user: User, currentIndex: number): void {
		let users = this.valueChartService.getValueChart().getUsers();
		if (currentIndex - 1 == -1)
			return;

		let temp = users[currentIndex - 1];
		users[currentIndex - 1] = user;
		users[currentIndex] = temp;

		this.valueChartViewerService.sortUsersToDisplay();
	}

	moveUserDown(user: User, currentIndex: number): void {
		let users = this.valueChartService.getValueChart().getUsers();
		if (currentIndex + 1 == users.length)
			return;

		let temp = users[currentIndex + 1];
		users[currentIndex + 1] = user;
		users[currentIndex] = temp;

		this.valueChartViewerService.sortUsersToDisplay();
	}

	// An anonymous function that links the alternative labels created by the ObjectiveChartRenderer to the Chart Detail box.
	// This requires interacting with the DOM since the ValueChart visualization is abstracted away from the main application
	// by the ValueChartDirective.
	linkAlternativeLabelsToDetailBox = () => {
		this.chartElement.selectAll('.' + ObjectiveChartDefinitions.ALTERNATIVE_LABEL)
					.classed('alternative-link', true);

		this.chartElement.selectAll('.' + ObjectiveChartDefinitions.ALTERNATIVE_LABEL).on('click', (d: Alternative) => {
			this.expandAlternative(d);
		});
	};


	getValueChartUrl(): string {
		return document.location.origin + '/join/ValueCharts/' + this.valueChart.getFName() + '?password=' + this.valueChart.password + '&purpose=newUser';
	}

	setUserChangesAccepted(eventObject: Event): void {
		this.valueChartService.getStatus().lockedByCreator = !(<HTMLInputElement> eventObject.target).checked;
		this.valueChartHttp.setValueChartStatus(this.valueChartService.getStatus()).subscribe((status) => {});
	}
}