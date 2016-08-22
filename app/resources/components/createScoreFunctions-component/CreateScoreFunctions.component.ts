import { Component, OnInit }										from '@angular/core';

// Application classes:
import { ScoreFunctionDirective }										from '../../directives/ScoreFunction.directive';
import { ValueChartService }											from '../../services/ValueChart.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }									from '../../services/ScoreFunctionViewer.service';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';
import { User }															from '../../model/User';
import { ScoreFunctionMap }												from '../../model/ScoreFunctionMap';
import { Objective }													from '../../model/Objective';
import { Domain }														from '../../model/Domain';
import { CategoricalDomain }											from '../../model/CategoricalDomain';
import { ContinuousDomain }												from '../../model/ContinuousDomain';
import { IntervalDomain }												from '../../model/IntervalDomain';
import { ScoreFunction }												from '../../model/ScoreFunction';
import { DiscreteScoreFunction }										from '../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }										from '../../model/ContinuousScoreFunction';

@Component({
  selector: 'CreateScoreFunctions',
  templateUrl: 'app/resources/components/createScoreFunctions-component/CreateScoreFunctions.template.html',
  directives: [ScoreFunctionDirective]
})
export class CreateScoreFunctionsComponent implements OnInit {
  user: User;
  selectedObjective: string;
  private services: any = {};

  constructor(
    private valueChartService: ValueChartService,
    private chartUndoRedoService: ChartUndoRedoService) { }

  ngOnInit() {
    this.services.valueChartService = this.valueChartService;
    this.services.chartUndoRedoService = this.chartUndoRedoService;
    this.services.scoreFunctionViewerService = new ScoreFunctionViewerService(this.valueChartService);

    this.user = this.valueChartService.getCurrentUser();
    if (!this.user.getScoreFunctionMap()) {
      this.user.setScoreFunctionMap(this.valueChartService.getInitialScoreFunctionMap());
    }

    this.selectedObjective = this.valueChartService.getPrimitiveObjectives()[0].getName();
  }

  advanceSelectedObjective() {
    let primObjs: string[] = this.valueChartService.getPrimitiveObjectivesByName();
    let selectedIndex: number = primObjs.indexOf(this.selectedObjective);
    let nextIndex: number = selectedIndex + 1;
    if (nextIndex >= primObjs.length) {
      nextIndex = 0;
    }
    this.selectedObjective = primObjs[nextIndex];
  }
}
