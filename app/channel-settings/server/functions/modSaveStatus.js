import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';
import { saveRoomCustomFields } from './saveRoomCustomFields';

export const modSaveStatus = function(rid, modStatus, user) {

    // TODO: add checker of status
    // const room = Rooms.findOneById(rid);
    // let customFields = room.customFields;

    const update = Rooms.modSetStatusById(rid, modStatus);
    // result = saveRoomCustomFields(rid, customFields, user);
    return update;
};