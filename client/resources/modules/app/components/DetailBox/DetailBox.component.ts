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
import { Subscription }															from 'rxjs/Subscription';

// Import Application Classes:
import { ObjectiveChartDefinitions }											from '../../../ValueChart/definitions/ObjectiveChart.definitions';

import { ValueChartHttpService }												from '../../services/ValueChartHttp.service';
import { UserNotificationService }												from '../../services/UserNotification.service';
import { HostService }															from '../../services/Host.service';
import { ValueChartViewerService }												from '../../services/ValueChartViewer.service';
import { CurrentUserService }													from '../../services/CurrentUser.service';
import { ValueChartService }													from '../../services/ValueChart.service';
import { RenderEventsService }													from '../../../ValueChart/services/RenderEvents.service';


// Import Model Classes:
import { ValueChart } 															from '../../../../model/ValueChart';
import { PrimitiveObjective } 													from '../../../../model/PrimitiveObjective';
import { User } 																from '../../../../model/User';
import { Alternative } 															from '../../../../model/Alternative';

// Import Types:
import { ViewConfig, InteractionConfig, ChartOrientation }						from '../../../../types/Config.types';


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
	@Input() valueChart: ValueChart;
	@Input() chartElement: d3.Selection<any, any, any, any>;
	@Input() enableManagement: boolean
	@Input() viewConfig: ViewConfig;
	@Input() showUsers: boolean;
	@Input() width: number;
	@Input() height: number;

	private subscription: Subscription;

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
		private valueChartHttpService: ValueChartHttpService,
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
			this.alternativeObjectiveValues[index] = alternative.getObjectiveValue(objective.getName());
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
		this.valueChartHttpService.deleteUser(this.valueChart._id, userToDelete.getUsername())
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
}