/*
* @Author: aaronpmishkin
* @Date:   2017-07-17 12:55:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-19 13:40:37
*/

import { Component, OnInit, Input, Output }										from '@angular/core';
import { EventEmitter, ElementRef }												from '@angular/core';


/*
	The notification modal is configurable and reusable notification modal window. It can be used in two main scenarios:
		1. Notifying the user of something using arbitrary text. In this case the modal window ONLY has an "OK"-type button.
		2. Requesting a user confirmation or action. In this case the modal has a "NO" and "YES" type buttons. This is referred to as "action enabled".
	The component can be toggle between the two modes via the component inputs, which is also where the button handlers,
	button text, modal title, and modal body text are set.
*/


@Component({
	selector: 'NotificationModal',
	templateUrl: './NotificationModal.template.html',
	providers: [ ]
})
export class NotificationModalComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Whether or not the modal is currently being displayed.
	private displayModal: boolean = false;

	// Toggle the display of the modal window.
	@Input() 
	public set display(display: boolean) {
		this.displayModal = display;

		let modalElement = $(this.elementRef.nativeElement).find('#notification-modal');

		if (display)
			modalElement.modal('show')
		else
			modalElement.modal('hide');
	}


	@Input() public title: string = '';						// The modal title text.
	@Input() public body: string = '';						// The modal body text.

	@Input() public actionEnabled: boolean = false;			// Whether or not the modal window implements an action/decision or simply a confirmation.
	@Input() public noActionText: string = '';				// The text for the "NO" type button if action is enabled.
	@Input() public actionText: string = '';				// The text for the "YES" type button if action is enabled.
	@Input() public noActionFunction: Function = () => {};	// The "NO" action function that will be called when the "NO" button is clicked. Does nothing by default
	@Input() public actionFunction: Function = () => {};	// The "YES" action function that will be called when the "YES" button is clicked. Does nothing by default

	@Output() modalClosed = new EventEmitter<boolean>();	// An output that notifies listeners of when the modal is closed.



	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private elementRef: ElementRef) {}



	ngOnInit() {
		// Emit events via the modalClosed output when the modal window is closed.
		$(this.elementRef.nativeElement).find('#notification-modal').on('hide.bs.modal', (event: Event) => { this.modalClosed.emit(false); });
	}
}