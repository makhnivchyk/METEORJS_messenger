import { RoomTypeConfig, roomTypes } from '../../utils';

export class DiscussionRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 't',
			order: 26,
			label: 'Discussion',
		});
	}
}

roomTypes.add(new DiscussionRoomType());
