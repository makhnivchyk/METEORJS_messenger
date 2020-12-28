import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models';

Meteor.startup(() => {
	// Add permissions for discussion
	const permissions = [
		{ _id: 'start-task', roles: ['admin', 'user', 'guest'] },
		{ _id: 'start-task-other-user', roles: ['admin', 'user', 'owner'] },
	];

	for (const permission of permissions) {
		Permissions.create(permission._id, permission.roles);
	}
});
