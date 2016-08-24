/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-24 10:40:22
*/

// Import Angular Classes:
import { Component } 												from '@angular/core';
import { OnInit } 													from '@angular/core';
import { Router, ROUTER_DIRECTIVES }								from '@angular/router';
import { TemplateRef, ViewContainerRef, ElementRef }				from '@angular/core';
import { ApplicationRef } 											from '@angular/core';


// Import Application classes
import { XMLValueChartParser } 										from '../../services/XMLValueChartParser.service';
import { CurrentUserService }										from '../../services/CurrentUser.service';
import { ValueChartService }										from '../../services/ValueChart.service';
import { UserHttpService }											from '../../services/UserHttp.service';
import { ExportValueChartComponent }								from '../ExportValueChart/ExportValueChart.component';
import { ValueChartXMLEncoder }										from '../../../utilities/classes/ValueChartXMLEncoder';


/*
	The root component is the base component of the application. It is the only component that is always displayed
	and its template contains the router-outlet directive. The router-outlet directive is the where the Angular router
	places whatever component should be displayed based upon the current url path. Its template is also where the 
	HTML for the application's navigation bar is defined. This is why the component's class body contains several methods 
	that relate the navigation bar functionality, such as logging out.

	The root component is also an important location for registering providers. Any angular services that are intended 
	to be singletons across the application should be placed in the root components list of providers. The root component
	is only ever initialized once by the application, which in turn means that the classes in the providers list will only
	ever be created once. 
*/


@Component({
	selector: 'root',
	templateUrl: 'client/resources/modules/app/components/Root/Root.template.html',
	directives: [ROUTER_DIRECTIVES, ExportValueChartComponent],
	providers: [TemplateRef,
		ViewContainerRef,
		XMLValueChartParser,
		ValueChartXMLEncoder,
		UserHttpService]
})
export class RootComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// The current chart type. Either 'normal' or 'average'. This is used to keep track of what type of ValueChart the 
	// ValueChartViewer is currently displaying. 'normal' is the default value.
	chartType: string = 'normal';

	// The current chart type. Either 'Score Distributions' or 'User Scores'. This is used to keep track of the view 
	// that the ScoreFuntionViewer is currently displaying. 'normal' is the default value.
	private switchScoreFunctionViewText: string = 'Score Distributions';


	private window = window;


	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						Any initialization that needs to be done should be placed in the ngOnInit method.
						This constructor should NOT be called manually. There is never any reason to manually create a component class;
						component classes should always be created by Angular so that the template can be parsed and two-way binding can be
						initialized. Angular will automatically handle the construction of this class whenever it's selector is used.
	*/
	constructor(
		private router: Router,
		private userHttpService: UserHttpService,
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private applicationRef: ApplicationRef) { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/* 	
		@returns {void}
		@description 	Initializes the RootComponent. Any initialization logic that is required for the component to run properly should
						be placed in this method. ngOnInit is called by Angular AFTER the first change detection cycle (i.e. ngDoCheck is called once).
						ngOnInit is only called ONCE by Angular. This function is thus used for one-time initialized only. Calling ngOnInit should be left 
						to Angular. Do NOT call it manually. 
	*/
	ngOnInit() {
		// Attach this Angular application reference to the window object.
		// This is to make it accessible to any additional windows that are created
		// by this window. This is specifically used by the ScoreFunctionViewerComponent.
		(<any>window).angularAppRef = this.applicationRef;
		(<any>window).childWindows = {};					// Initialize a map to used as storage for references to an windows created by this window.
	}

	/* 	
		@returns {boolean} - True if ValueChart is a group ValueChart. False otherwise.
		@description 	Determines if the current ValueChart is a group ValueChart (i.e. has more than one user) or an individual ValueChart (i.e. has exactly one user).
	*/
	isGroupChart(): boolean {
		return (this.valueChartService.getValueChart() && !this.valueChartService.getValueChart().isIndividual()) || 		// Check the currentUserService
			(window.opener && !(<any>window.opener).valueChartService.isIndividual()); 					// Check to see if this is a pop-up window
	}

	/* 	
		@returns {void} - 
		@description 	Logs the current user out by making a call to the logout endpoint. This endpoint deletes the current user's 
						session. This method then redirects the application to the register page no matter what the current URL path is.
						This is because users must be authenticated (or temporary) to view pages other than register.
						Note that this method should only called when a user is logged in. It may throw errors if no user is logged in,
						or if the user is a temporary user.
	*/
	logout(): void {
		this.userHttpService.logout()
			.subscribe(logoutResult => {
				this.currentUserService.setLoggedIn(false);
				(<any> window).destination = '/register';
				this.router.navigate(['/register']);
			});
	}

	/* 	
		@returns {void} - 
		@description 	Changes the current url path in order to cause the ValueChartViewer to display the average
						of the current ValueChart. ValueChart viewer displays an average of the current ValueChart when the view route parameter
						is this string: 'average'. This method should only be called when the current route is '/view', or when
						that is the desired route as it will navigate there.
	*/
	viewAverageChart(): void {
		if (this.isGroupChart()) {
			this.chartType = 'average';
			this.router.navigate(['/view', this.valueChartService.getValueChartName() + '-average']);
		}
	}

	/* 	
		@returns {void} - 
		@description 	Changes the current url path in order to cause the ValueChartViewer to display the current ValueChart.
						This method should only be called when the current route is '/view', or when that is the desired route as it will navigate there.
						The most frequent use case for viewGroupChart is to return to viewing the group ValueChart after calling viewAverageChart to view the average.
	*/
	viewGroupChart(): void {
		this.chartType = 'normal';
		this.valueChartService.setValueChart(this.valueChartService.inactiveValueCharts.pop());
		this.router.navigate(['/view', this.valueChartService.getValueChartName()]);
	}

	/* 	
		@returns {void} - 
		@description 	Changes the url path in order to cause the ScoreFunctionViewer to display either the Score Function Plot,
						or the Score Distribution Chart. Which one is displayed depends on the current state of the ScoreFucntionViewer.
						This method will show the Score Function Plot if the score Distribution Chart is currently displayed,
						and vice versa. This method should only be called when the current route is 'scoreFunction', as it will cause 
						navigation to that url path.
	*/
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