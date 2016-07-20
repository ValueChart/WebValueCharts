/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-19 19:06:19
*/

import { Component }									from '@angular/core';
import { Router, ROUTER_DIRECTIVES }					from '@angular/router';

// Application classes:
import { XMLValueChartParser } 							from '../../services/XMLValueChartParser.service';
import { ValueChartDirective }							from '../../directives/ValueChart.directive';
import { CurrentUserService }							from '../../services/CurrentUser.service';

// Sample Data:
import { singleHotel, groupHotel, waterManagement}		from '../../data/DemoValueCharts';



@Component({
	selector: 'create',
	templateUrl: '/app/resources/components/create-component/Create.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class CreateComponent {

	demoValueCharts: any[] = [{ xmlString: singleHotel, name: 'Hotel Selection Problem', type: 'Individual' }, { xmlString: groupHotel, name: 'Hotel Selection Problem', type: 'Group' }, { xmlString: waterManagement, name: 'Wastewater Management', type: 'Individual' }]

	constructor(
		private router: Router,
		private valueChartParser: XMLValueChartParser, 
		private currentUserService: CurrentUserService) {
	}

	selectDemoValueChart(demoChart: any): void {
		this.currentUserService.setValueChart(this.valueChartParser.parseValueChart(demoChart.xmlString));
		var parameters = this.currentUserService.getValueChart().getName();
		this.router.navigate(['/view/', parameters]);
	}

	goToValueChart(event: Event): void {
		this.uploadValueChart(event,['/view/']);
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
				var parameters = '';
				if (route[0] === '/view/')
					parameters = this.currentUserService.getValueChart().getName();
				this.router.navigate([route[0], parameters]);
			}
		};
		reader.readAsText(xmlFile);
	}

}