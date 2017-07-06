export enum UserRole {
	Viewer,					// The user is viewing a ValueChart. They are not permitted to edit the ValueChart or interact with it in any way.
	Participant, 			// The user is participating in a ValueChart.
	UnsavedParticipant,
	Owner,
	OwnerAndParticipant,
}