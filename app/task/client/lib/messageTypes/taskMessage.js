import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../../../ui-utils/client';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'task-created',
		system: false,
		message: 'task-created',
		data(message) {
			return {
				message: `<svg class="rc-icon" aria-hidden="true"><use xlink:href="#icon-task"></use></svg> ${ message.msg }`,
			};
		},
	});
});
