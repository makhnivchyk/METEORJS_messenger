import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Task', function() {
		// the channel for which discussions are created if none is explicitly chosen

		this.add('Task_enabled', true, {
			group: 'Task',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
	});

	settings.add('Accounts_Default_User_Preferences_sidebarShowTask', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		public: true,
		i18nLabel: 'Group_task',
	});

	const globalQuery = {
		_id: 'RetentionPolicy_Enabled',
		value: true,
	};

	settings.add('RetentionPolicy_DoNotPruneTask', true, {
		group: 'RetentionPolicy',
		section: 'Global Policy',
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_DoNotPruneTask',
		i18nDescription: 'RetentionPolicy_DoNotPruneTask_Description',
		enableQuery: globalQuery,
	});

	settings.add('RetentionPolicy_DoNotPruneThreads', true, {
		group: 'RetentionPolicy',
		section: 'Global Policy',
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_DoNotPruneThreads',
		i18nDescription: 'RetentionPolicy_DoNotPruneThreads_Description',
		enableQuery: globalQuery,
	});
});
