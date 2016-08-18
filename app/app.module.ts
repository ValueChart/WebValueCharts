/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:15:19
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-18 11:12:12
*/


// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { BrowserModule } 						from '@angular/platform-browser';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';
import { HTTP_PROVIDERS } 						from '@angular/http';

// Import Application Classes:
import { APP_ROUTER_PROVIDERS, ROUTER }			from './app.routes';
import { CREATION_ROUTER }						from './resources/components/createValueChart-component/Creation.routes';
	// Components List:

import { RootComponent }						from './resources/components/root-component/Root.component';
import { RegisterComponent }					from './resources/components/register-component/Register.component';
import { HomeComponent }						from './resources/components/home-component/Home.component';
import { ValueChartViewerComponent }			from './resources/components/valueChartViewer-component/ValueChartViewer.component';
import { AccountComponent }						from './resources/components/account-component/Account.component';
import { MyValueChartsComponent }				from './resources/components/myValueCharts-component/MyValueCharts.component';
import { ScoreFunctionViewerComponent }			from './resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.component';
import { ExportValueChartComponent }			from './resources/components/exportValueChart-component/ExportValueChart.component';

	// Directives List:
import { ValueChartDirective }					from './resources/directives/ValueChart.directive';
import { ScoreFunctionDirective }				from './resources/directives/ScoreFunction.directive';


	// Modules:
import { CreateModule }							from './resources/components/create.module';
import { UtilitiesModule }						from './resources/components/utilities.module';

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
