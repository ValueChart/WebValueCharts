import { Component, OnInit }										    from '@angular/core';
import { Observable }                               from 'rxjs/Observable';
import { Subscriber }                               from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Application classes:
import { ScoreFunctionDirective }										from '../../../utilities/directives/ScoreFunction.directive';
import { ValueChartService }										  	from '../../../app/services/ValueChart.service';
import { CreationStepsService }                      from '../../services/CreationSteps.service';
import { ChartUndoRedoService }											from '../../../app/services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }								from '../../../app/services/ScoreFunctionViewer.service';

// Model Classes
import { ValueChart } 													    from '../../../../model/ValueChart';
import { User }														      	  from '../../../../model/User';
import { ScoreFunctionMap }												  from '../../../../model/ScoreFunctionMap';
import { Objective }													      from '../../../../model/Objective';
import { Domain }														        from '../../../../model/Domain';
import { CategoricalDomain }											  from '../../../../model/CategoricalDomain';
import { ContinuousDomain }												  from '../../../../model/ContinuousDomain';
import { IntervalDomain }												    from '../../../../model/IntervalDomain';
import { ScoreFunction }												    from '../../../../model/ScoreFunction';
import { DiscreteScoreFunction }										from '../../../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }								  from '../../../../model/ContinuousScoreFunction';

@Component({
  selector: 'CreateScoreFunctions',
  templateUrl: 'client/resources/modules/create/components/CreateScoreFunctions/CreateScoreFunctions.template.html',
  directives: [ScoreFunctionDirective],
  providers: [ScoreFunctionViewerService]
})
export class CreateScoreFunctionsComponent implements OnInit {
  user: User;
  selectedObjective: string;
  initialBestOutcomes: { [objName: string]: string | number };
  initialWorstOutcomes: { [objName: string]: string | number };
  private services: any = {};

  // Validation fields:
  validationTriggered: boolean = false;
  badScoreFunctions: string[] = [];

  constructor(
    private valueChartService: ValueChartService,
    private creationStepsService: CreationStepsService,
    private chartUndoRedoService: ChartUndoRedoService,
    private scoreFunctionViewerService: ScoreFunctionViewerService) { }

  ngOnInit() {
    this.creationStepsService.observables[this.creationStepsService.PREFERENCES] = new Observable<boolean>((subscriber: Subscriber<boolean>) => {
            subscriber.next(this.validate());
            subscriber.complete();
        });
    this.services.valueChartService = this.valueChartService;
    this.services.chartUndoRedoService = this.chartUndoRedoService;
    this.services.scoreFunctionViewerService = this.scoreFunctionViewerService;

    this.user = this.valueChartService.getCurrentUser();
    this.initialBestOutcomes = {};
    this.initialWorstOutcomes = {};

    if (!this.user.getScoreFunctionMap()) {
      this.user.setScoreFunctionMap(this.valueChartService.getInitialScoreFunctionMap());
    }
    for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
      this.initialBestOutcomes[objName] = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).bestElement;
      this.initialWorstOutcomes[objName] = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).worstElement;
    }
    this.selectedObjective = this.valueChartService.getPrimitiveObjectives()[0].getName();
  }

  ngOnDestroy() {
    // Reset weight map if best or worst outcome has changed
    for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
      let newBestOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).bestElement;
      let newWorstOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).worstElement;
      if (newBestOutcome !== this.initialBestOutcomes[objName] || newWorstOutcome !== this.initialWorstOutcomes[objName]) {
        this.valueChartService.resetWeightMap(this.user, this.valueChartService.getDefaultWeightMap());
      }
    }
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

  // Validation methods:

  validate(): boolean {
    this.validationTriggered = true;
    this.setBadScoreFunctions();
    if (this.badScoreFunctions.length === 0) {
      this.rescaleScoreFunctions();
      return true;
    }
    return false;
  }

  setBadScoreFunctions(): void {
    let badScoreFunctions: string[] = [];
    for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
      let bestOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).bestElement;
      let worstOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).worstElement;
      let bestOutcomeScore = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).getScore(bestOutcome);
      let worstOutcomeScore = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).getScore(worstOutcome);
      if (bestOutcomeScore === worstOutcomeScore) {
        badScoreFunctions.push(objName);
      }
      this.badScoreFunctions = badScoreFunctions;
    }
  }

  rescaleScoreFunctions(): void {
    let rescaled: boolean = false;
    for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
      let scoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName);
      if (scoreFunction.rescale()) {
        rescaled = true;
      }
    }
    if (rescaled) {
      toastr.warning("Score functions rescaled so that scores range from 0 to 1.");
    }    
  }

  badScoreFunctionsText(): string {
    return "An Objective's outcomes can't all have the same score. Please adjust the score functions for: " + 
              this.badScoreFunctions.map(objname => objname).join(', ');
  }
}
