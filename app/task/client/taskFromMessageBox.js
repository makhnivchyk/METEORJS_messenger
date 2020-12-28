import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { messageBox, modal } from '../../ui-utils/client';
import { t } from '../../utils/client';
import { settings } from '../../settings/client';

Meteor.startup(function() {
	Tracker.autorun(() => {
	
		messageBox.actions.add('Create_new', 'Task', {
			id: 'start-task',
			icon: 'bell',
			condition: () => true,
			action(data) {
				modal.open({
					title: t('Task_title'),
					modifier: 'modal',
					content: 'CreateTask',
					data: {
						...data,
						onCreate() {
							modal.close();
						},
					},
					showConfirmButton: false,
					showCancelButton: false,
					confirmOnEnter: false,
				});
			},
		});
	});
});
