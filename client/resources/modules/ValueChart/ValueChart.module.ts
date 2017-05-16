/*
* @Author: aaronpmishkin
* @Date:   2017-05-15 17:22:03
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-16 12:31:38
*/

// Import Angular Classes:
import { NgModule }    						  	from '@angular/core';
import { CommonModule }   						from '@angular/common';
import { FormsModule }							from '@angular/forms';
import { HttpModule } 							from '@angular/http';

// Import Application Classes:
import { ValueChartDirective }					from './directives/ValueChart.directive';
import { RendererService }						from './services/Renderer.service';

import { RendererScoreFunctionUtility }			from './utilities/RendererScoreFunction.utility';
import { RendererConfigUtility }				from './utilities/RendererConfig.utility';
import { RendererDataUtility }					from './utilities/RendererData.utility';

@NgModule({
	imports: [ 
		CommonModule,
	],
	declarations: [
		ValueChartDirective
	],
	exports: [
		ValueChartDirective
	],
	providers: [
		//Services:
		RendererService,
		// Utilities:
		RendererScoreFunctionUtility,
		RendererDataUtility,
		RendererConfigUtility
	],
})
export class ValueChartModule { }