import { Component }				from '@angular/core';
import { Router }				from '@angular/router';

// Application classes:
import { CurrentUserService }			from '../../services/CurrentUser.service';

// Model Classes
import { IndividualValueChart } 	from '../../model/IndividualValueChart';

@Component({
	selector: 'buildAlternatives',
	templateUrl: 'app/resources/components/buildAlternatives-component/BuildAlternatives.template.html'
})
export class BuildAlternativesComponent {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService) {	}

}