/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-13 16:41:21
*/

import { Component } 										from '@angular/core';
import { OnInit } 											from '@angular/core';
import { Router, ROUTER_DIRECTIVES }						from '@angular/router';
import { TemplateRef, ViewContainerRef, ElementRef }		from '@angular/core';

// Application classes
import { XMLValueChartParser } 								from '../../services/XMLValueChartParser.service';
import { CurrentUserService }								from '../../services/CurrentUser.service';

import { ExportValueChartComponent }						from '../exportValueChart-component/ExportValueChart.component';

@Component({
	selector: 'root',
	templateUrl: './app/resources/components/root-component/Root.template.html',
	directives: [ROUTER_DIRECTIVES, ExportValueChartComponent],
	providers: [XMLValueChartParser, 
				TemplateRef, 
				ViewContainerRef,
				CurrentUserService]
})
export class RootComponent implements OnInit {

	chartType: string = 'normal';

	constructor(private router: Router, private currentUserService: CurrentUserService) {}
	
	ngOnInit() { }

}