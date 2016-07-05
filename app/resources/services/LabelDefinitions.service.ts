/*
* @Author: aaronpmishkin
* @Date:   2016-07-05 16:08:11
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-05 16:42:33
*/

import { Injectable } 												from '@angular/core';



@Injectable()
export class LabelDefinitions {

	ROOT_CONTAINER: string = 'label-root-container';
	ROOT_CONTAINER_NAME: string = 'rootcontainer';

	LABEL_SUBCONTAINER: string = 'label-subcontainer';
	SUBCONTAINER_OUTLINE: string = 'label-subcontainer-outline';
	SUBCONTAINER_TEXT: string = 'label-subcontainer-text';
	SUBCONTAINER_DIVIDER: string = 'label-subcontainer-divider';

	OUTLINE_CONTAINER: string = 'label-outline-container';
	OUTLINE: string = 'label-outline';

	PRIMITIVE_OBJECTIVE_LABEL: string = 'label-primitive-objective';

	LABELS_CONTAINER: string = 'label-labels-container';

	SCORE_FUNCTIONS_CONTAINER: string = 'label-scorefunction-container';
	SCORE_FUNCTION: string = 'label-scorefunction';

	constructor() { }
}