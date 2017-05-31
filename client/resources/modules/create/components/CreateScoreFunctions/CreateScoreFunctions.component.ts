// Import Angular Classes:
import { Component, OnInit }										    from '@angular/core';
import { Observable }                               from 'rxjs/Observable';
import { Subscriber }                               from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { ScoreFunctionDirective }										from '../../../utilities/directives/ScoreFunction.directive';
import { CurrentUserService }                       from '../../../app/services/CurrentUser.service';
import { ValueChartService }										  	from '../../../app/services/ValueChart.service';
import { CreationStepsService }                     from '../../services/CreationSteps.service';
import { ChartUndoRedoService }											from '../../../ValueChart/services/ChartUndoRedo.service';
import { ValidationService }                        from '../../../app/services/Validation.service';

import { RendererScoreFunctionUtility }							from '../../../ValueChart/utilities/RendererScoreFunction.utility';

// Import Model Classes:
import { ValueChart } 													    from '../../../../model/ValueChart';
import { User }														      	  from '../../../../model/User';
import { ScoreFunctionMap }												  from '../../../../model/ScoreFunctionMap';
import { Objective }													      from '../../../../model/Objective';
import { PrimitiveObjective }                       from '../../../../model/PrimitiveObjective';
import { Domain }														        from '../../../../model/Domain';
import { CategoricalDomain }											  from '../../../../model/CategoricalDomain';
import { ContinuousDomain }												  from '../../../../model/ContinuousDomain';
import { IntervalDomain }												    from '../../../../model/IntervalDomain';
import { ScoreFunction }												    from '../../../../model/ScoreFunction';
import { DiscreteScoreFunction }										from '../../../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }								  from '../../../../model/ContinuousScoreFunction';
import { WeightMap }                                from '../../../../model/WeightMap';

/*
  This component defines the UI controls for defining the ScoreFunctions for a ValueChart.
  It uses the ScoreFunctionDirective to render the plots.
*/

@Component({
  selector: 'CreateScoreFunctions',
  templateUrl: './CreateScoreFunctions.template.html',
  providers: [RendererScoreFunctionUtility]
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
  latestDefaults: { [objName: string]: string }; // Track latest default function so we can set dropdown accordingly
  public services: any = {}; // Services container to pass to ScoreFunctionDirective


  // Validation fields:
  validationTriggered: boolean = false;
  errorMessages: string[]; // Validation error messages

  // Default initial function types
  flat: string = ScoreFunction.FLAT;
  poslin: string = ScoreFunction.POSLIN;
  neglin: string = ScoreFunction.NEGLIN;

  // ========================================================================================
  //                   Constructor
  // ========================================================================================

  /*
    @returns {void}
    @description   Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
            This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
  */
  constructor(
    public valueChartService: ValueChartService,
    private creationStepsService: CreationStepsService,
    private rendererScoreFunctionUtility: RendererScoreFunctionUtility,
    private currentUserService: CurrentUserService,
    private validationService: ValidationService) { }

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
    this.services.chartUndoRedoService = new ChartUndoRedoService();
    this.services.rendererScoreFunctionUtility = this.rendererScoreFunctionUtility;

    let newUser = false;
    if (!this.valueChartService.currentUserIsDefined()) {
      let user = new User(this.currentUserService.getUsername());
      user.setScoreFunctionMap(new ScoreFunctionMap());
      user.setWeightMap(new WeightMap());
      this.valueChartService.getValueChart().setUser(user);
      newUser = true;
    }
    this.user = this.valueChartService.getCurrentUser();
    this.initialBestOutcomes = {};
    this.initialWorstOutcomes = {};
    this.latestDefaults = {};

    // Make sure there is a score function for every Objective
    for (let obj of this.valueChartService.getPrimitiveObjectives()) {
      if (!this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getName())) {
        this.user.getScoreFunctionMap().setObjectiveScoreFunction(obj.getName(), obj.getDefaultScoreFunction());
      }
      // Make sure the score function is complete
      let scoreFunction = this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getName());
      if (obj.getDomainType() === 'categorical' || obj.getDomainType() === 'interval') {
        let elements = [] ;
        for (let elt of (<CategoricalDomain>obj.getDomain()).getElements()) {
          if (scoreFunction.getScore(elt) === undefined) {
            scoreFunction.setElementScore(elt, 0.5); // If score for element is missing for whatever reason, set it to 0.5
          }
        } 
      } 
      this.initialBestOutcomes[obj.getName()] = scoreFunction.bestElement;
      this.initialWorstOutcomes[obj.getName()] = scoreFunction.worstElement; 
    }
    this.selectedObjective = this.valueChartService.getPrimitiveObjectives()[0].getName();
    if (!newUser) {
      this.validate()   
    }
  }

  /*   
    @returns {void}
    @description   Destroys CreateScoreFunctions. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
            requires that a different component is displayed in the router-outlet.
  */
  ngOnDestroy() {
    // Clear weight map if best or worst outcome has changed
    if (this.user.getWeightMap().getWeightTotal() > 0) {
      for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
        let newBestOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).bestElement;
        let newWorstOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).worstElement;
        if (newBestOutcome !== this.initialBestOutcomes[objName] || newWorstOutcome !== this.initialWorstOutcomes[objName]) {
          this.user.setWeightMap(new WeightMap());
          toastr.warning("Your weights have been reset because the best/worst outcome on some Objective has changed.");
          break;
        }
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

  // ================================ Default Function Selection Methods ====================================

  /*   
    @returns {void}
    @description   Reinitializes the score function to the selected default.
                   (Currently called when user selects a new default from the dropdown or clicks 'Reset').
  */
  resetScoreFunction() {
    let obj: PrimitiveObjective = <PrimitiveObjective>this.valueChartService.getObjectiveByName(this.selectedObjective);
    this.user.getScoreFunctionMap().getObjectiveScoreFunction(this.selectedObjective).initialize(obj,this.latestDefaults[this.selectedObjective]);
  }

  // ================================ Validation Methods ====================================

    /*   
    @returns {boolean}
    @description   Checks validity of score functions.
  */
  validate(): boolean {
    this.validationTriggered = true;
    this.errorMessages = this.validationService.validateScoreFunctions(this.valueChartService.getValueChart(), this.user);
    return this.errorMessages.length === 0;
  }

   /*   
    @returns {void}
    @description   Resets error messages if validation has already been triggered.
            (This is done whenever the user makes a change to the chart. This way, they get feedback while repairing errors.)
  */
  resetErrorMessages(): void {
    if (this.validationTriggered) {
      this.errorMessages = this.validationService.validateScoreFunctions(this.valueChartService.getValueChart(), this.user);
    }
  }
}
