/*
* @Author: aaronpmishkin
* @Date:   2017-05-15 10:25:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-30 22:08:03
*/

// Import Angular Classes:
import { Component, Input }														from '@angular/core';
import { OnInit }																from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';
import { Subscription }															from 'rxjs/Subscription';

// Import Application Classes:
import { ObjectiveChartDefinitions }											from '../../../ValueChart/definitions/ObjectiveChart.definitions';

import { ValueChartHttpService }												from '../../services/ValueChartHttp.service';
import { HostService }															from '../../services/Host.service';
import { RenderEventsService }													from '../../../ValueChart/services/RenderEvents.service';


// Import Model Classes:
import { ValueChart } 															from '../../../../model/ValueChart';
import { PrimitiveObjective } 													from '../../../../model/PrimitiveObjective';
import { User } 																from '../../../../model/User';
import { Alternative } 															from '../../../../model/Alternative';

// Import Types:
import { ViewConfig, InteractionConfig }										from '../../../../types/Config.types';


@Component({
	selector: 'DetailBox',
	templateUrl: './DetailBox.template.html',
	providers: []
})
export class DetailBoxComponent implements OnInit {


	// ========================================================================================
	// 									Fields
	// ========================================================================================

	@Input() valueChart: ValueChart;
	@Input() enableManagement: boolean
	@Input() viewConfig: ViewConfig;
	@Input() width: number;
	@Input() height: number;

	private subscription: Subscription;

	public detailBoxAlternativeTab: string;
	private alternativeObjectives: string[];
	private alternativeObjectiveValues: (string | number)[];

	public userToRemove: User;

	public detailBoxCurrentTab: string;
	public DETAIL_BOX_CHART_TAB: string = 'chart';
	public DETAIL_BOX_ALTERNATIVES_TAB: string = 'alternatives';
	public DETAIL_BOX_USERS_TAB: string = 'users';

	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	constructor(
		private valueChartHttpService: ValueChartHttpService,
		private hostService: HostService) { }

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
					toastr.warning(userToDelete.getUsername() + ' has left the ValueChart');
				}

				// The Host connection is active, so let it handle notifications about the deleted user.
			},
			err => {
				toastr.error(userToDelete.getUsername() + ' could not be deleted');
			});
	}

	// An anonymous function that links the alternative labels created by the ObjectiveChartRenderer to the Chart Detail box.
	linkAlternativeLabelsToDetailBox = () => {
		d3.selectAll('.' + ObjectiveChartDefinitions.ALTERNATIVE_LABEL)
					.classed('alternative-link', true);

		$('.' + ObjectiveChartDefinitions.ALTERNATIVE_LABEL).click((eventObject: Event) => {
			var selection: d3.Selection<any, any, any, any> = d3.select(<any> eventObject.target);
			this.expandAlternative(selection.datum());
		});
	};


	getValueChartUrl(): string {
		return document.location.origin + '/join/ValueCharts/' + this.valueChart.getId() + '?password=' + this.valueChart.password;
	}
}