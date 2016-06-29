import { Component }				from '@angular/core';
import { Router }				from '@angular/router';

// Application classes:
import { CurrentUserService }			from '../../services/CurrentUser.service';

// Model Classes
import { IndividualValueChart } 	from '../../model/IndividualValueChart';

@Component({
	selector: 'buildcVf',
	templateUrl: 'app/resources/components/buildCVF-component/BuildCVF.template.html'
})
export class BuildCVFComponent {

	constructor(
		private router: Router,
		private currentUserService: CurrentUserService) {	}

}