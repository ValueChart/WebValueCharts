// Import Angular Classes:
import { Component, OnInit }										    from '@angular/core';
import { Observable }                               from 'rxjs/Observable';
import { Subscriber }                               from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ScoreFunctionDirective }										from '../../../utilities/directives/ScoreFunction.directive';
import { ValueChartService }										  	from '../../../app/services/ValueChart.service';
import { CreationStepsService }                     from '../../services/CreationSteps.service';
import { ChartUndoRedoService }											from '../../../app/services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }								from '../../../app/services/ScoreFunctionViewer.service';

// Import Model Classes:
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

/*
  This component defines the UI controls for defining the ScoreFunctions for a ValueChart.
  It uses the ScoreFunctionDirective to render the plots.
*/

@Component({
  selector: 'CreateScoreFunctions',
  templateUrl: 'client/resources/modules/create/components/CreateScoreFunctions/CreateScoreFunctions.template.html',
  providers: [ScoreFunctionViewerService]
})
export class CreateScoreFunctionsComponent implements OnInit {

  // ========================================================================================
  //                   Fields
  // ========================================================================================

  user: User;
  selectedObjective: string; // Objective selected in the dropdown menu
  initialBestOutcomes: { [objName: string]: string | number }; // Track initial best outcomes for each Objective
                                                               // so we can reset weights if it changes
  initialWorstOutcomes: { [objName: string]: string | number }; // Track initial best outcomes for each Objective
                                                                // so we can reset weights if it changes
  private services: any = {}; // Services container to pass to ScoreFunctionDirective

  // Validation fields:
  validationTriggered: boolean = false;
  badScoreFunctions: string[] = []; // Score functions that failed validation

  // ========================================================================================
  //                   Constructor
  // ========================================================================================

  /*
    @returns {void}
    @description   Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
            This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
  */
  constructor(
    private valueChartService: ValueChartService,
    private creationStepsService: CreationStepsService,
    private chartUndoRedoService: ChartUndoRedoService,
    private scoreFunctionViewerService: ScoreFunctionViewerService) { }

  // ========================================================================================
  //                   Methods
  // ========================================================================================

  // ================================ Life-cycle Methods ====================================

  /*   
    @returns {void}
    @description   Initializes CreateScoreFunctions. ngOnInit is only called ONCE by Angular.
            Calling ngOnInit should be left to Angular. Do not call it manually.
  */
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
      this.validationTriggered = true;
      this.initialBestOutcomes[objName] = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).bestElement;
      this.initialWorstOutcomes[objName] = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).worstElement;
    }
    this.selectedObjective = this.valueChartService.getPrimitiveObjectives()[0].getName();
  }

  /*   
    @returns {void}
    @description   Destroys CreateScoreFunctions. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
            requires that a different component is displayed in the router-outlet.
  */
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

  // ================================ Objective Selection Methods ====================================

  /*   
    @returns {void}
    @description   Changes selected Objective to next in list.
                   (Currently called when user clicks "Next" button next to dropdown).
  */
  advanceSelectedObjective() {
    let primObjs: string[] = this.valueChartService.getPrimitiveObjectivesByName();
    let selectedIndex: number = primObjs.indexOf(this.selectedObjective);
    let nextIndex: number = selectedIndex + 1;
    if (nextIndex >= primObjs.length) {
      nextIndex = 0;
    }
    this.selectedObjective = primObjs[nextIndex];
  }

  // ================================ Validation Methods ====================================

  /*   
    @returns {boolean}
    @description   Validates ScoreFunctions.
                   This should be done prior to updating the ValueChart model and saving to the database.
  */
  validate(): boolean {
    this.validationTriggered = true;
    this.setBadScoreFunctions();
    if (this.badScoreFunctions.length === 0) {
      this.rescaleScoreFunctions();
      return true;
    }
    return false;
  }

  /*   
   @returns {void}
   @description   Sets badScoreFunctions to contain names of all Objectives whose ScoreFunctions are invalid.
                  Currently, it simply checks where each ScoreFunctions has distinct best and worst outcome scores.
 */
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

  /*   
    @returns {void}
    @description   Rescales all ScoreFunctions so that the worst and best outcomes have scores of 0 and 1 respectively.
  */
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

  /*   
    @returns {string}
    @description   Returns text for bad score function validation message.
  */
  badScoreFunctionsText(): string {
    return "An Objective's outcomes can't all have the same score. Please adjust the score functions for: " +
      this.badScoreFunctions.map(objname => objname).join(', ');
  }
}
