import { Request, Response } from 'express';
import * as Joi from 'joi';

import config from '../../../config';
import Endpoint, { HttpRequestType, getRequesterIdFromRequest } from '../../endpoints/group.endpoint';
import GroupFunctions from '../../group.sharedFunctions';
import { validateObjectID } from '../../../utils/joi';
import User from '../user.interface';
import { UserRole, requiredRole } from '../user.role';
import GroupRepository from '../../group.repository';
import { Unexpected } from '../../../utils/errors/server.error';

export default class RemoveUserFromGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.DELETE, '/:id/users/:userID');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID).required(),
        userID: Joi.string().custom(validateObjectID).required(),
      },
      headers: {
        [config.userHeader]: Joi.string().required(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const groupID: string = req.params['id'];
    const requesterID = getRequesterIdFromRequest(req);
    const userToAdd: string = req.params['userID'];

    const deletedUserID = await RemoveUserFromGroup.logic(groupID, userToAdd, requesterID);
    res.status(200).json(deletedUserID);
  }

  /**
   * updates a user role in a group.
   * The function throws an error in the following cases:
   * - The group does not exist.
   * - The user is not in the group.
   * - The requester user does not have permission to add the user.
   * @param groupID - the ID of the group.
   * @param userID - the ID of the user to add to the group.
   * @param userRole - the role of the user to add to the group.
   * @param requesterID - the ID of the user requesting the action.
   */
  static async logic(
    groupID: string,
    userID: string,
    requesterID: string): Promise<string> {

    const userRole = await GroupFunctions.getUserRoleInGroup(groupID, userID);

    // A user can remove himself from a group regardless of his role in the group.
    if (userID !== requesterID) {
      await GroupFunctions.verifyUserCanPreformAction(
        groupID,
        requesterID,
        requiredRole.user.delete(userRole),
        `delete the user ${userID} with the role ${UserRole[userRole]} from the group ${groupID}.`,
        );
    }

    const res = await GroupRepository.removeUser(groupID, userID);
    if (!res) {
      throw new Unexpected(`Unexpected error when deleting user ${userID} with role ${userRole} from the group ${groupID}`);
    }
    return userID;
  }
}
