import { callbacks } from '../../../callbacks/server';
import { Messages, Rooms } from '../../../models/server';
import { deleteRoom } from '../../../lib/server';

/**
 * We need to propagate the writing of new message in a discussion to the linking
 * system message
 */
callbacks.add('afterSaveMessage', function(message, { _id, isTask } = {}) {
	if (isTask) {
		Messages.refreshTaskMetadata({ rid: _id }, message);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateTaskMetadata');

callbacks.add('afterDeleteMessage', function(message, { _id, isTask } = {}) {
	if (isTask) {
		Messages.refreshTaskMetadata({ rid: _id }, message);
	}
	//makhn
	if (message.drid) {
		deleteRoom(message.drid);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateTaskMetadata');

callbacks.add('afterDeleteRoom', (rid) => {
	Rooms.find({ isTask: rid }, { fields: { _id: 1 } }).forEach(({ _id }) => deleteRoom(_id));
	return rid;
}, callbacks.priority.LOW, 'DeleteTaskChain');

// TODO discussions define new fields
callbacks.add('afterRoomNameChange', (roomConfig) => {
	const { rid, name, oldName } = roomConfig;
	Rooms.update({ isTask: rid, ...oldName && { topic: oldName } }, { $set: { topic: name } }, { multi: true });
	return roomConfig;
}, callbacks.priority.LOW, 'updateTopicTask');

callbacks.add('afterDeleteRoom', (drid) => {
	Messages.update({ drid }, {
		$unset: {
			dcount: 1,
			dlm: 1,
			drid: 1,
		},
	});
	return drid;
}, callbacks.priority.LOW, 'CleanTaskMessage');
