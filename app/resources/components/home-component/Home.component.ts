/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-20 12:47:23
*/

// Import Angular Classes:
import { Component }									from '@angular/core';
import { Router, ROUTER_DIRECTIVES }					from '@angular/router';

// Application classes:
import { XMLValueChartParser } 							from '../../services/XMLValueChartParser.service';
import { ValueChartDirective }							from '../../directives/ValueChart.directive';
import { CurrentUserService }							from '../../services/CurrentUser.service';
import { ValueChartService }							from '../../services/ValueChart.service';
import { ValueChartHttpService }						from '../../services/ValueChartHttp.service';

// Model Classes:
import { ValueChart }									from '../../model/ValueChart';

// Sample Data:
import { singleHotel, groupHotel, waterManagement}		from '../../data/DemoValueCharts';

@Component({
	selector: 'home',
	templateUrl: 'app/resources/components/home-component/Home.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class HomeComponent {

	demoValueCharts: any[] = [{ xmlString: singleHotel, name: 'Hotel Selection Problem', type: 'Individual' }, { xmlString: groupHotel, name: 'Hotel Selection Problem', type: 'Group' }, { xmlString: waterManagement, name: 'Wastewater Management', type: 'Individual' }]

	private valueChartName: string;
	private valueChartPassword: string;
	private invalidCredentials: boolean;

	constructor(
		private router: Router,
		private valueChartParser: XMLValueChartParser,
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private valueChartHttpService: ValueChartHttpService) { }

	joinValueChart(chartName: string, chartPassword: string): void {
		this.valueChartHttpService.getValueChartStructure(chartName, chartPassword)
			.subscribe(
			(valueChart: ValueChart) => {
				this.valueChartService.setValueChart(valueChart);
				this.currentUserService.setJoiningChart(true);
				$('#chart-credentials-modal').modal('hide');
				this.router.navigate(['createValueChart/newUser/ScoreFunctions']);
			},
			// Handle Server Errors (like not finding the ValueChart)
			(error) => {
				if (error === '404 - Not Found')
					this.invalidCredentials = true;	// Notify the user that the credentials they input are invalid.
			});
	}

	selectDemoValueChart(demoChart: any): void {
		this.valueChartService.setValueChart(this.valueChartParser.parseValueChart(demoChart.xmlString));
		this.currentUserService.setJoiningChart(false);
		var parameters = this.valueChartService.getValueChart().getName();
		this.router.navigate(['/view/', parameters]);
	}

	goToValueChart(event: Event): void {
		this.uploadValueChart(event, ['/view/']);
	}

	uploadValueChart(event: Event, route: String[]) {
		var xmlFile: File = (<HTMLInputElement>event.target).files[0];

		var reader: FileReader = new FileReader();
		reader.onload = (fileReaderEvent: ProgressEvent) => {
			if (event.isTrusted) {
				var xmlString = (<FileReader>fileReaderEvent.target).result;
				this.valueChartService.setValueChart(this.valueChartParser.parseValueChart(xmlString));
				this.currentUserService.setJoiningChart(false);

				if (route[1] === undefined) {
					route[1] = this.valueChartService.getValueChart().getName();
				}
				this.router.navigate(route);
			}
		};
		reader.readAsText(xmlFile);
	}

}