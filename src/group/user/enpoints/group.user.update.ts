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

export default class UpdateUserRole extends Endpoint {

  constructor() {
    super(HttpRequestType.PUT, '/:id/users/:userID');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID).required(),
        userID: Joi.string().custom(validateObjectID).required(),
      },
      body: {
        role: Joi.number().min(0).max(2).required(),
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
    const userRole: UserRole = req.body['role'];

    const addedUser = await UpdateUserRole.logic(groupID, userToAdd, userRole, requesterID);
    res.status(200).json(addedUser);
  }

  /**
   * removes a user from a group.
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
    userRole = UserRole.Member,
    requesterID: string): Promise<User> {

    const oldRole = await GroupFunctions.getUserRoleInGroup(groupID, userID);
    await GroupFunctions.verifyUserCanPreformAction(
      groupID,
      requesterID,
      requiredRole.user.update(oldRole, userRole),
      `update a user permission from ${UserRole[oldRole]} to ${UserRole[userRole]}.`,
    );

    const res = await GroupRepository.updateUserRole(groupID, userID, userRole);
    if (!res) {
      throw new Unexpected(`Unexpected error when updating user ${userID} role ${userRole} to group ${groupID}`);
    }

    return { id: userID, role: userRole };
  }
}
