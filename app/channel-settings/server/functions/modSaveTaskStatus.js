import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';
import { saveRoomCustomFields } from './saveRoomCustomFields';

export const modSaveTaskStatus = function(rid, modTaskStatus, user) {

    // TODO: add checker of status
    // const room = Rooms.findOneById(rid);
    // let customFields = room.customFields;

    const update = Rooms.modSetTaskStatusById(rid, modTaskStatus);
    // result = saveRoomCustomFields(rid, customFields, user);
    return update;
};