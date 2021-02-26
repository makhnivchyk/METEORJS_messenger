import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { hasAtLeastOnePermission, canSendMessage } from '../../../authorization/server';
import { Messages, Rooms } from '../../../models/server';
import { createRoom, addUserToRoom, sendMessage, attachMessage } from '../../../lib/server';
import { settings } from '../../../settings/server';
import { roomTypes } from '../../../utils/server';
import { callbacks } from '../../../callbacks/server';

// import { modSaveDiscussionStatus } from '../../../channel-settings/server/functions';
import { modSaveStatus } from '../../../channel-settings/server/functions/modSaveStatus';
import { modDefaultStatusKey } from '/own_modifications/statusChoices';

const getParentRoom = (rid) => {
	const room = Rooms.findOne(rid);
	return room && (room.isTask ? Rooms.findOne(room.isTask, { fields: { _id: 1 } }) : room);
};

const createTaskMessage = (rid, user, drid, msg, message_embedded) => {
	const welcomeMessage = {
		msg,
		rid,
		drid,
		attachments: [message_embedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('task-created', rid, '', user, welcomeMessage);
};

const mentionMessage = (rid, { _id, username, name }, message_embedded) => {
	const welcomeMessage = {
		rid,
		u: { _id, username, name },
		ts: new Date(),
		_updatedAt: new Date(),
		attachments: [message_embedded].filter((e) => e),
	};

	return Messages.insert(welcomeMessage);
};

const create = ({ isTask,pmid, taskt_name, reply, users, user, delivery_from, delivery_to, deadline }) => {
	// if you set both, prid and pmid, and the rooms doesnt match... should throw an error)
	let message = false;
	if (pmid) {
		message = Messages.findOne({ _id: pmid }); 
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { method: 'TaskCreation' });
		}
		if (isTask) {
			if (isTask !== getParentRoom(message.rid)._id) {
				throw new Meteor.Error('error-invalid-arguments', { method: 'TaskCreation' });
			}
		} else {
			isTask = message.rid;
		}
	}

	if (!isTask) {
		throw new Meteor.Error('error-invalid-arguments', { method: 'TaskCreation' });
	}

	let p_room;
	try {
		p_room = canSendMessage(isTask, { uid: user._id, username: user.username, type: user.type });
	} catch (error) {
		throw new Meteor.Error(error.message);
	}

	if (p_room.isTask) {
		throw new Meteor.Error('error-nested-task', 'Cannot create nested tasks', { method: 'TaskCreation' });
	}

	if (pmid) {
		const taskAlreadyExists = Rooms.findOne({
			isTask,
		    pmid,
		}, {
			fields: { _id: 1 },
		});
		if (taskAlreadyExists) { // do not allow multiple discussions to the same message'\
			addUserToRoom(taskAlreadyExists._id, user);
			return taskAlreadyExists;
		}
	}

	const name = Random.id();

	// auto invite the replied message owner
	const invitedUsers = message ? [message.u.username, ...users] : users;
	
	const type = roomTypes.getConfig(p_room.t).getTaskType();
	const task = createRoom(type, name, user.username, [...new Set(invitedUsers)], false, {
		isTask: true,
		fname: taskt_name,
		description: message.msg, // TODO discussions remove
		topic: p_room.name, // TODO discussions remove
		isTask,


		//
	}, {
		// overrides name validation to allow anything, because discussion's name is randomly generated
		nameValidationRegex: /.*/,
	},
	delivery_from,
	delivery_to,
	deadline
	
	);

	let taskMsg;
	if (pmid) {
		mentionMessage(task._id, user, attachMessage(message, p_room));

		taskMsg = createTaskMessage(message.rid, user, task._id, taskt_name, attachMessage(message, p_room));
	} else {
		taskMsg = createTaskMessage(isTask, user, task._id, taskt_name);
	}

	callbacks.runAsync('afterSaveMessage', taskMsg, p_room, user._id);

	if (reply) {
		sendMessage(user, { msg: reply }, task);
	}

	// #mod
	modSaveStatus(task._id, modDefaultStatusKey);
	//

	return task;
};

Meteor.methods({
	/**
	* Create task by room or message
	* @constructor
	* @param {string} isTask - Parent Room Id - The room id, optional if you send pmid.
	* @param {string} pmid - Parent Message Id - Create the task by a message, optional.
	* @param {string} reply - The reply, optional
	* @param {string} taskt_name - task name
	* @param {string[]} users - users to be added
	* @param {string} delivery_from - The reply, optional
	* @param {string} delivery_to - The reply, optional
	* @param {string} deadline - The reply, optional
	
	*/
	createTask({ isTask, pmid, taskt_name, reply, users ,delivery_from, delivery_to, deadline}) {
		if (!settings.get('Task_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a task', { method: 'createTask' });
		}

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'TaskCreation' });
		}

		if (!hasAtLeastOnePermission(uid, ['start-task', 'start-task-other-user'])) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a task', { method: 'createTask' });
		}

		return create({ uid, isTask, pmid, taskt_name, reply, users, user: Meteor.user(), delivery_from, delivery_to, deadline });
	},
});
