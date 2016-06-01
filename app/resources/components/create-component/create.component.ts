import { Component }				from '@angular/core';

// Application classes:
import { XMLValueChartParser } 		from '../../services/XMLValueChartParser.service';

// Model Classes
import { ValueChart } 				from '../../model/ValueChart';

@Component({
	selector: 'create',
	templateUrl: 'app/resources/components/create-component/create.template.html',
	styleUrls: ['app/resources/components/create-component/create.style.css'],
	providers: [XMLValueChartParser]
})
export class CreateComponent {

	constructor(private valueChartParser: XMLValueChartParser) {}

	uploadValueChart(event: Event) {
		console.log(event);

		var xmlFile: File = (<HTMLInputElement> event.target).files[0];

		var reader: FileReader = new FileReader();
		reader.onload = (fileReaderEvent: ProgressEvent) => {
			console.log(fileReaderEvent);
			if (event.isTrusted) {
				var xmlString = (<FileReader>fileReaderEvent.target).result;

				this.valueChartParser.parseValueChart(xmlString);
			}
		};

		reader.readAsText(xmlFile);
	}

}