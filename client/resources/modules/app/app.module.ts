/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:15:19
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 11:53:47
*/


// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { BrowserModule } 						from '@angular/platform-browser';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';
import { HTTP_PROVIDERS } 						from '@angular/http';

// Import Application Classes:
import { APP_ROUTER_PROVIDERS, ROUTER }			from './app.routes';
import { CREATION_ROUTER }						from '../create/Create.routes';
	// Components List:

import { RootComponent }						from './components/Root/Root.component';
import { RegisterComponent }					from './components/Register/Register.component';
import { HomeComponent }						from './components/Home/Home.component';
import { ValueChartViewerComponent }			from './components/ValueChartViewer/ValueChartViewer.component';
import { AccountComponent }						from './components/Account/Account.component';
import { MyValueChartsComponent }				from './components/MyValueCharts/MyValueCharts.component';
import { ScoreFunctionViewerComponent }			from './components/ScoreFunctionViewer/ScoreFunctionViewer.component';
import { ExportValueChartComponent }			from './components/ExportValueChart/ExportValueChart.component';

	// Directives List:
import { ValueChartDirective }					from './directives/ValueChart.directive';
import { ScoreFunctionDirective }				from '../utilities/directives/ScoreFunction.directive';


	// Modules:
import { CreateModule }							from '../create/create.module';
import { UtilitiesModule }						from '../utilities/utilities.module';

/*
	This is where the application is bootstrapped. Bootstrapping is when the initial components of the application are connected
	together by Angular. This should only ever be done once for an application, and it should be the first thing is that is done
	when the application is delivered to the client. 

	Only classes that are absolute needed before any component is instantiated should be registered in the bootstrap method call.
	For us, this is the RootComponent, which is the only component that is always displayed regardless of the url path, 
	APP_ROUTER_PROVIDERS, which contains the classes required for our application's routing to function properly,
	and HTTP_PROVIDERS, the providers required for HTTP methods to work properly across the application. Refrain from adding
	more classes to this list if possible. Having many classes bootstrap slows down the application's initial loading time 
	and is bad style.
*/


@NgModule({
	imports: [ 
		BrowserModule,
		FormsModule,
		HttpModule,
		ROUTER,
		CreateModule,
		UtilitiesModule
	],
	declarations: [
		RootComponent,
		RegisterComponent,
		HomeComponent,
		ValueChartViewerComponent,
		AccountComponent,
		MyValueChartsComponent,
		ScoreFunctionViewerComponent,
		ExportValueChartComponent,
		ValueChartDirective
	],
	providers: [
		APP_ROUTER_PROVIDERS
	],
	bootstrap: [ 
		RootComponent 
	]	
})
export class AppModule { }
