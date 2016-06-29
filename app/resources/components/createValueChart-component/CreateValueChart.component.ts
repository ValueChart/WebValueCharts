import { Component }				from '@angular/core';
import { Router }				from '@angular/router';

// Application classes:
import { CurrentUserService }			from '../../services/CurrentUser.service';

// Model Classes
import { IndividualValueChart } 	from '../../model/IndividualValueChart';

@Component({
	selector: 'createValueChart',
	templateUrl: 'app/resources/components/createValueChart-component/CreateValueChart.template.html'
})
export class CreateValueChartComponent {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService) {	}

}