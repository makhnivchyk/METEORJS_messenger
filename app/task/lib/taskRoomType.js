import { RoomTypeConfig, roomTypes } from '../../utils';

export class TaskRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'task',
			order: 25,
			label: 'Task',
		});
	}
}

roomTypes.add(new TaskRoomType());
