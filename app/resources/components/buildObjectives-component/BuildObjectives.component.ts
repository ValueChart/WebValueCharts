import { Component }				from '@angular/core';
import { Router }				from '@angular/router';

// Application classes:
import { CurrentUserService }			from '../../services/CurrentUser.service';

// Model Classes
import { IndividualValueChart } 	from '../../model/IndividualValueChart';

@Component({
	selector: 'buildObjectives',
	templateUrl: 'app/resources/components/buildObjectives-component/BuildObjectives.template.html'
})
export class BuildObjectivesComponent {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService) {	}

}