import { Component, OnInit }												from '@angular/core';

// Import Application Classes:
import { ValueChartService }												from '../../../app/services/ValueChart.service';

// Model Classes
import { ValueChart } 														from '../../../../model/ValueChart';

@Component({
	selector: 'CreateBasicInfo',
	templateUrl: 'client/resources/modules/create/components/CreateBasicInfo/CreateBasicInfo.template.html',
})
export class CreateBasicInfoComponent implements OnInit {
	valueChartName: string;
	valueChartDescription: string;
	valueChartPassword: string;

	constructor(private valueChartService: ValueChartService) { }

	ngOnInit() {
		this.valueChartName = this.valueChartService.getValueChartName();
		this.valueChartDescription = this.valueChartService.getValueChart().getDescription();
		this.valueChartPassword = this.valueChartService.getValueChart().password ? this.valueChartService.getValueChart().password : "";
	}

	updateValueChart():void {
		this.valueChartService.getValueChart().setName(this.valueChartName);
		this.valueChartService.getValueChart().setDescription(this.valueChartDescription);
		this.valueChartService.getValueChart().password = this.valueChartPassword;
	}
}
