import { Component, Input, OnInit }											from '@angular/core';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';

@Component({
	selector: 'CreateBasicInfo',
	templateUrl: 'app/resources/components/createBasicInfo-component/CreateBasicInfo.template.html',
	inputs: ['vc']
})
export class CreateBasicInfoComponent implements OnInit {
	valueChart: ValueChart;
	valueChartName: string;
	valueChartDescription: string;
	valueChartPassword: string;

	constructor() { }

	ngOnInit() {
		this.valueChartName = this.valueChart.getName();
		this.valueChartDescription = this.valueChart.getDescription();
		this.valueChartPassword = this.valueChart.password ? this.valueChart.password : "";
  	}

	ngOnDestroy() {
		this.valueChart.setName(this.valueChartName);
		this.valueChart.setDescription(this.valueChartDescription);	
    	this.valueChart.password = this.valueChartPassword;
	}

	@Input() set vc(value: any) {
		this.valueChart = <ValueChart> value;
	}
}
