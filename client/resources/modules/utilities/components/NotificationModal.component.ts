/*
* @Author: aaronpmishkin
* @Date:   2017-07-17 12:55:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-19 13:40:37
*/

import { Component, OnInit, Input, Output }										from '@angular/core';
import { EventEmitter, ElementRef }												from '@angular/core';


@Component({
	selector: 'NotificationModal',
	templateUrl: './NotificationModal.template.html',
	providers: [ ]
})
export class NotificationModalComponent implements OnInit {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private displayModal: boolean = false;

	@Input() 
	public set display(display: boolean) {
		this.displayModal = display;

		let modalElement = $(this.elementRef.nativeElement).find('#notification-modal');

		if (display)
			modalElement.modal('show')
		else
			modalElement.modal('hide');
	}


	@Input() public title: string = '';
	@Input() public body: string = '';

	@Input() public actionEnabled: boolean = false;
	@Input() public noActionText: string = '';
	@Input() public actionText: string = '';
	@Input() public actionFunction: Function = () => {};	// The action function does nothing by default
	@Input() public noActionFunction: Function = () => {};	// The no action function does nothing by default

	@Output() modalClosed = new EventEmitter<boolean>();
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


		$(this.elementRef.nativeElement).find('#notification-modal').on('hide.bs.modal', (event: Event) => { this.modalClosed.emit(false); });
	}
}