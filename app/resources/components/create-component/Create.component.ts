/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-04 21:25:39
*/

import { Component }									from '@angular/core';
import { Router, ROUTER_DIRECTIVES }					from '@angular/router';

// Application classes:
import { XMLValueChartParser } 							from '../../services/XMLValueChartParser.service';
import { ValueChartDirective }							from '../../directives/ValueChart.directive';
import { CurrentUserService }							from '../../services/CurrentUser.service';


@Component({
	selector: 'create',
	templateUrl: 'app/resources/components/create-component/Create.template.html',
	styleUrls: ['app/resources/components/create-component/Create.style.css'],
	directives: [ROUTER_DIRECTIVES]
})
export class CreateComponent {

	constructor(
		private router: Router,
		private valueChartParser: XMLValueChartParser, 
		private currentUserService: CurrentUserService) {	}

	goToValueChart(event: Event): void {
		this.uploadValueChart(event,['/view/ValueChart']);
	}

	addUserToExistingChart(event: Event) {
		// Second parameter specifies use case for CreateValueChart workflow
		this.uploadValueChart(event,['/createValueChart','newUser']);
	}

	uploadValueChart(event: Event, route: String[]) {
		var xmlFile: File = (<HTMLInputElement> event.target).files[0];

		var reader: FileReader = new FileReader();
		reader.onload = (fileReaderEvent: ProgressEvent) => {
			if (event.isTrusted) {
				var xmlString = (<FileReader>fileReaderEvent.target).result;
				this.currentUserService.setValueChart(this.valueChartParser.parseValueChart(xmlString));
				this.router.navigate(route);
			}
		};
		reader.readAsText(xmlFile);
	}

}