import { Component }				from '@angular/core';
import { Router }				from '@angular/router';

// Application classes:
import { CurrentUserService }			from '../../services/CurrentUser.service';

// Model Classes
import { GroupValueChart } 	from '../../model/GroupValueChart';

@Component({
	selector: 'createGroupValueChart',
	templateUrl: 'app/resources/components/createGroupValueChart-component/CreateGroupValueChart.template.html'
})
export class CreateGroupValueChartComponent {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService) {	}

}