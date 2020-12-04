import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';
import { hasPermission } from '../../authorization/client';
import { MessageAction, modal } from '../../ui-utils/client';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { t } from '../../utils/client';



Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Task_enabled')) {
			return MessageAction.removeButton('start-task');
		}

		MessageAction.addButton({
			id: 'start-task',
			icon: 'task',
			label: 'Task_start',
			context: ['message', 'message-mobile'],
			async action() {
				const { msg: message } = messageArgs(this);

				modal.open({
					title: t('Task_title'),
					modifier: 'modal',
					content: 'CreateTask',
					data: { rid: message.rid,
						message,
						onCreate() {
							modal.close();
						} },
					confirmOnEnter: false,
					showConfirmButton: false,
					showCancelButton: false,
				});
			},
			condition({ msg: { u: { _id: uid }, taskrid, dcount }, subscription, u }) {
				if (taskrid || !isNaN(dcount)) {
					return false;
				}
				if (!subscription) {
					return false;
				}

				return uid !== u._id ? hasPermission('start-task-other-user') : hasPermission('start-task');
			},
			order: 1,
			group: 'menu',
		});
	});
});
