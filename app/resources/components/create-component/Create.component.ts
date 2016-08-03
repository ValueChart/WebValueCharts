/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-03 14:04:57
*/

import { Component }									from '@angular/core';
import { Router, ROUTER_DIRECTIVES }					from '@angular/router';

// Application classes:
import { XMLValueChartParser } 							from '../../services/XMLValueChartParser.service';
import { ValueChartDirective }							from '../../directives/ValueChart.directive';
import { CurrentUserService }							from '../../services/CurrentUser.service';
import { GroupVcHttpService }							from '../../services/GroupVcHttp.service';

// Model Classes:
import { ValueChart }									from '../../model/ValueChart';

// Sample Data:
import { singleHotel, groupHotel, waterManagement}		from '../../data/DemoValueCharts';

@Component({
	selector: 'create',
	templateUrl: 'app/resources/components/create-component/Create.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class CreateComponent {

	demoValueCharts: any[] = [{ xmlString: singleHotel, name: 'Hotel Selection Problem', type: 'Individual' }, { xmlString: groupHotel, name: 'Hotel Selection Problem', type: 'Group' }, { xmlString: waterManagement, name: 'Wastewater Management', type: 'Individual' }]

	private valueChartName: string;
	private valueChartPassword: string;
	private invalidCredentials: boolean;

	constructor(
		private router: Router,
		private valueChartParser: XMLValueChartParser, 
		private currentUserService: CurrentUserService,
		private groupVcHttpService: GroupVcHttpService) { }

	joinValueChart(chartName: string, chartPassword: string): void {
		this.groupVcHttpService.getValueChartStructure(chartName, chartPassword)
			.subscribe(
				(valueChart: ValueChart) => { 
					this.currentUserService.setValueChart(valueChart);
					(<any> $('#close-chart-credentials-modal')).click();
					this.router.navigate(['createValueChart', 'newUser']);
				},
				// Handle Server Errors (like not finding the ValueChart)
				(error) => { 
					if (error === '404 - Not Found')
						this.invalidCredentials = true;	// Notify the user that the credentials they input are invalid.
				});
	}

	selectDemoValueChart(demoChart: any): void {
		this.currentUserService.setValueChart(this.valueChartParser.parseValueChart(demoChart.xmlString));
		var parameters = this.currentUserService.getValueChart().getName();
		this.router.navigate(['/view/', parameters]);
	}

	goToValueChart(event: Event): void {
		this.uploadValueChart(event,['/view/']);
	}

	uploadValueChart(event: Event, route: String[]) {
		var xmlFile: File = (<HTMLInputElement> event.target).files[0];

		var reader: FileReader = new FileReader();
		reader.onload = (fileReaderEvent: ProgressEvent) => {
			if (event.isTrusted) {
				var xmlString = (<FileReader>fileReaderEvent.target).result;
				this.currentUserService.setValueChart(this.valueChartParser.parseValueChart(xmlString));
				if (route[1] === undefined) {
					route[1] = this.currentUserService.getValueChart().getName();
				}
				this.router.navigate(route);
			}
		};
		reader.readAsText(xmlFile);
	}

}