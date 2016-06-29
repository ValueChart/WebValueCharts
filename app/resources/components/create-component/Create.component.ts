/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 16:11:58
*/

import { Component }				from '@angular/core';
import { Router }					from '@angular/router';

// Application classes:
import { XMLValueChartParser } 		from '../../services/XMLValueChartParser.service';
import { ValueChartDirective }		from '../../directives/ValueChart.directive';
import { CurrentUserService }		from '../../services/CurrentUser.service';

// Model Classes
import { IndividualValueChart } 	from '../../model/IndividualValueChart';

@Component({
	selector: 'create',
	templateUrl: 'app/resources/components/create-component/Create.template.html',
	styleUrls: ['app/resources/components/create-component/Create.style.css'],
})
export class CreateComponent {

	constructor(
		private router: Router,
		private valueChartParser: XMLValueChartParser, 
		private currentUserService: CurrentUserService) {	}

	uploadValueChart(event: Event) {
		var xmlFile: File = (<HTMLInputElement> event.target).files[0];

		var reader: FileReader = new FileReader();
		reader.onload = (fileReaderEvent: ProgressEvent) => {
			if (event.isTrusted) {
				var xmlString = (<FileReader>fileReaderEvent.target).result;
				this.currentUserService.setValueChart(this.valueChartParser.parseValueChart(xmlString));
				this.router.navigate(['/view/ValueChart']); 
			}
		};

		reader.readAsText(xmlFile);
	}

	uploadGroupValueChart(event: Event): void {
		// TODO: Implement uploading Group ValueCharts
	}

}