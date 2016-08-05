/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-05 16:15:37
*/

import { Component } 												from '@angular/core';
import { OnInit } 													from '@angular/core';
import { Router, ROUTER_DIRECTIVES }								from '@angular/router';
import { TemplateRef, ViewContainerRef, ElementRef }				from '@angular/core';
import { ApplicationRef } 											from '@angular/core';


// Application classes
import { XMLValueChartParser } 										from '../../services/XMLValueChartParser.service';
import { CurrentUserService }										from '../../services/CurrentUser.service';
import { GroupVcHttpService }										from '../../services/GroupVcHttp.service';
import { UserHttpService }											from '../../services/UserHttp.service';
import { ExportValueChartComponent }								from '../exportValueChart-component/ExportValueChart.component';
import { ValueChartXMLEncoder }										from '../../utilities/ValueChartXMLEncoder';


@Component({
	selector: 'root',
	templateUrl: 'app/resources/components/root-component/Root.template.html',
	directives: [ROUTER_DIRECTIVES, ExportValueChartComponent],
	providers: [TemplateRef, 
				ViewContainerRef,
				XMLValueChartParser,
				ValueChartXMLEncoder,
				GroupVcHttpService,
				UserHttpService]
})
export class RootComponent implements OnInit {

	chartType: string = 'normal';


	private switchScoreFunctionViewText: string = 'Score Distributions';

	constructor(
		private router: Router, 
		private userHttpService: UserHttpService,
		private currentUserService: CurrentUserService, 
		private applicationRef: ApplicationRef) {}
	
	ngOnInit() { 
		(<any> window).angularAppRef = this.applicationRef;
		(<any> window).childWindows = {};

		if (this.router.url.indexOf('expandScoreFunction') === -1) {
			this.router.navigate(['expandScoreFunction', 'plot']);		
		}
	}

	isGroupChart(): boolean {																						
		return (this.currentUserService.getValueChart() && !this.currentUserService.getValueChart().isIndividual()) || 		// Check the currentUserService
				(window.opener && !(<any> window.opener).valueChartService.isIndividual()); 					// Check to see if this is a pop-up window
	}

	logout(): void {
		this.userHttpService.logout()
			.subscribe(logoutResult => { 
				this.currentUserService.setLoggedIn(false);
				this.router.navigate(['/register']);
			});

	}

	switchScoreFunctionView() {

		if (this.router.url.indexOf('distribution') === -1) {
			this.router.navigate(['scoreFunction', 'distribution']);		
			this.switchScoreFunctionViewText = 'User Scores';
		} else {
			this.router.navigate(['scoreFunction', 'plot']);	
			this.switchScoreFunctionViewText = 'Score Distributions';
		}

	}

}