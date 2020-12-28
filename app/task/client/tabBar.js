import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../ui-utils/client';
import { settings } from '../../settings';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'task',
		i18nTitle: 'Tasks',
		icon: 'bell',
		template: 'tasksTabbar',
		full: true,
		order: 1,
		condition: () => settings.get('Task_enabled'),
	});
});
