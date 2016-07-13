/*
* @Author: aaronpmishkin
* @Date:   2016-07-12 16:46:23
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-13 11:12:08
*/

import { Component }															from '@angular/core';
import { OnInit, OnDestroy }													from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES }							from '@angular/router';

// Application classes:
import { ScoreFunctionRenderer }												from '../../renderers/ScoreFunction.renderer';
import { DiscreteScoreFunctionRenderer }										from '../../renderers/DiscreteScoreFunction.renderer';
import { ContinuousScoreFunctionRenderer }										from '../../renderers/ContinuousScoreFunction.renderer';




@Component({
	selector: 'ScoreFunction',
	templateUrl: '/app/resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.template.html',
	directives: []
})
export class ScoreFunctionViewerComponent {

	constructor() { }
}
