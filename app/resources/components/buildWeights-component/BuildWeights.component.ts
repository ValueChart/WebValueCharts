import { Component }				from '@angular/core';
import { Router }				from '@angular/router';

// Application classes:
import { CurrentUserService }			from '../../services/CurrentUser.service';

// Model Classes
import { IndividualValueChart } 	from '../../model/IndividualValueChart';

@Component({
	selector: 'buildWeights',
	templateUrl: 'app/resources/components/buildWeights-component/BuildWeights.template.html'
})
export class BuildWeightsComponent {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService) {	}

}