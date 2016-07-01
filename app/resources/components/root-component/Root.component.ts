/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-24 09:52:26
*/

import { Component } 										from '@angular/core';
import { OnInit } 											from '@angular/core';
import { Router, ROUTER_DIRECTIVES }						from '@angular/router';
import { TemplateRef, ViewContainerRef, ElementRef }		from '@angular/core';

// Application classes
import { XMLValueChartParser } 								from '../../services/XMLValueChartParser.service';
import { ChartDataService }									from '../../services/ChartData.service';
import { RenderConfigService }								from '../../services/RenderConfig.service';
import { CurrentUserService }								from '../../services/CurrentUser.service';


@Component({
	selector: 'root',
	templateUrl: 'app/resources/components/root-component/Root.template.html',
	directives: [ROUTER_DIRECTIVES],
	providers: [XMLValueChartParser, 
				TemplateRef, 
				ViewContainerRef,
				CurrentUserService]
})
export class RootComponent implements OnInit {

	constructor(private router: Router) {}
	
	ngOnInit() {	}

}