import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';
import { saveRoomCustomFields } from './saveRoomCustomFields';

export const modSaveDiscussionStatus = function(rid, modDiscussionStatus, user) {

    // TODO: add checker of status
    // const room = Rooms.findOneById(rid);
    // let customFields = room.customFields;

    const update = Rooms.modSetDiscussionStatusById(rid, modDiscussionStatus);
    // result = saveRoomCustomFields(rid, customFields, user);
    return update;
};