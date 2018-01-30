/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:15:19
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-16 12:22:21
*/


// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { BrowserModule } 						from '@angular/platform-browser';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';

// Import Application Classes:
import { APP_ROUTER_PROVIDERS, ROUTER }			from './app.routes';
// Components:
import { RootComponent }						from './components';
import { RegisterComponent }					from './components';
import { HomeComponent }						from './components';
import { ValueChartViewerComponent }			from './components';
import { DetailBoxComponent }					from './components';
import { ViewOptionsComponent }					from './components';
import { InteractionOptionsComponent }			from './components';
import { AccountComponent }						from './components';
import { ScoreFunctionViewerComponent }			from './components';
import { ExportValueChartComponent }			from './components';
import { CreateValueChartComponent }			from './components';
import { CreateAlternativesComponent }			from './components';
import { CreateBasicInfoComponent }				from './components';
import { CreateObjectivesComponent }			from './components';
import { CreateScoreFunctionsComponent }		from './components';
import { CreateWeightsComponent }				from './components';
import { NotificationModalComponent }			from './components';
// Modules:
import { ValueChartVisModule }					from '../ValueChartVis';

/*
	This is the AppModule declaration. It creates the AppModule, imports whatever modules it depends on, registers
	the components that belong to it, registers required providers, and defines the component that should be bootstrapped.
	The AppModule is the base module of WebValueCharts. It has the main application router (ROUTER), and is responsible for all
	application functionality with the exception of ValueChart creation, which the delegates to the CreateModule.
*/

@NgModule({
	// Import all required modules.
	imports: [ 	
		BrowserModule,
		FormsModule,
		HttpModule,
		ROUTER,			// Import the main application router defined in app.routes.ts
		ValueChartVisModule
	],
	// All Components and Directives that belong to this module MUST be declared here. Any modules that are shared between AppModule and another module
	// must be declared in the UtilitiesModule instead and imported via that module.
	declarations: [
		RootComponent,
		RegisterComponent,
		HomeComponent,
		ValueChartViewerComponent,
		DetailBoxComponent,
		ViewOptionsComponent,
		InteractionOptionsComponent,
		AccountComponent,
		ScoreFunctionViewerComponent,
		ExportValueChartComponent,
		CreateValueChartComponent,
		CreateAlternativesComponent,
		CreateBasicInfoComponent,
		CreateObjectivesComponent,
		CreateScoreFunctionsComponent,
		CreateWeightsComponent,
		NotificationModalComponent
	],
	// Register any required providers. This is just the Router providers.
	providers: [
		APP_ROUTER_PROVIDERS,
	],
	// Set the RootComponent to be the AppModules' base component.
	bootstrap: [ 
		RootComponent 
	]	
})
export class AppModule { }
