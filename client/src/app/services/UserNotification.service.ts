/*
* @Author: aaronpmishkin
* @Date:   2017-07-17 11:35:58
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-17 11:55:33
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core'

import * as _ 												from 'lodash';

@Injectable()
export class UserNotificationService {


	// ========================================================================================
	// 									Fields
	// ========================================================================================

	static ERROR_TIMEOUT: number = 0;			// Errors that must be addressed can only be dismissed manually.
	static WARNING_TIMEOUT: number = 20000;		// 20 second timeout for warnings that don't need to be addressed.
	static SUCCESS_TIMEOUT: number = 5000;		// 5 second timeout for successful action notifications.
	static INFO_TIMOUT: number = 20000;			// 20 second timeout for update/information notifications.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() {
		// Set global toastr settings
		toastr.options.newestOnTop = false;
	}


	displayErrors(errors: string[]): void {
		errors.forEach(error => toastr.error(error,'' , { timeOut: UserNotificationService.ERROR_TIMEOUT, extendedTimeOut: UserNotificationService.ERROR_TIMEOUT, closeButton: true }));
	}

	displayWarnings(warnings: string[]): void {
		warnings.forEach(warning => toastr.warning(warning,'' , { timeOut: UserNotificationService.WARNING_TIMEOUT, closeButton: false }));
	}

	displayInfo(info: string[]): void {
		info.forEach(msg => toastr.info(msg,'' , { timeOut: UserNotificationService.INFO_TIMOUT, closeButton: false }));
	}

	displaySuccesses(successes: string[]): void {
		successes.forEach(success => toastr.success(success,'' , { timeOut: UserNotificationService.SUCCESS_TIMEOUT, closeButton: false }));
	}		

}
