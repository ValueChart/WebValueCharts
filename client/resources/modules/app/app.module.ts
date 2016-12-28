/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:15:19
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-28 13:40:30
*/


// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { BrowserModule } 						from '@angular/platform-browser';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';

// Import Application Classes:
import { APP_ROUTER_PROVIDERS, ROUTER }			from './app.routes';
import { CREATION_ROUTER }						from '../create/Create.routes';
// Components:
import { RootComponent }						from './components/Root/Root.component';
import { RegisterComponent }					from './components/Register/Register.component';
import { HomeComponent }						from './components/Home/Home.component';
import { ValueChartViewerComponent }			from './components/ValueChartViewer/ValueChartViewer.component';
import { ViewOptionsComponent }					from './components/widgets/ViewOptions/ViewOptions.component';
import { AccountComponent }						from './components/Account/Account.component';
import { MyValueChartsComponent }				from './components/MyValueCharts/MyValueCharts.component';
import { ScoreFunctionViewerComponent }			from './components/ScoreFunctionViewer/ScoreFunctionViewer.component';
import { ExportValueChartComponent }			from './components/ExportValueChart/ExportValueChart.component';
// Directives:
import { ValueChartDirective }					from './directives/ValueChart.directive';
import { ScoreFunctionDirective }				from '../utilities/directives/ScoreFunction.directive';
// Modules:
import { CreateModule }							from '../create/create.module';
import { UtilitiesModule }						from '../utilities/utilities.module';


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
		CreateModule,	// Import the create 
		UtilitiesModule
	],
	// All Components and Directives that belong to this module MUST be declared here. Any modules that are shared between AppModule and another module
	// must be declared in the UtilitiesModule instead and imported via that module.
	declarations: [
		RootComponent,
		RegisterComponent,
		HomeComponent,
		ValueChartViewerComponent,
		ViewOptionsComponent,
		AccountComponent,
		MyValueChartsComponent,
		ScoreFunctionViewerComponent,
		ExportValueChartComponent,
		ValueChartDirective
	],
	// Register any required providers. This is just the Router providers.
	providers: [
		APP_ROUTER_PROVIDERS
	],
	// Set the RootComponent to be the AppModules' base component.
	bootstrap: [ 
		RootComponent 
	]	
})
export class AppModule { }
