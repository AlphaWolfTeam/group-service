import { Request, Response } from 'express';
import * as Joi from 'joi';
import config from '../../../config';
import Endpoint, { getRequesterIdFromRequest, HttpRequestType } from '../../../utils/endpoint';
import { UserIsNotInGroup } from '../../../utils/errors/client.error';
import Unexpected from '../../../utils/errors/server.error';
import { validateObjectID } from '../../../utils/joi';
import GroupRepository from '../../group.repository';
import GroupFunctions from '../../group.sharedFunctions';
import { requiredRole, UserRole, USER_ROLES_NUM } from '../user.role';

export default class UpdateUserRole extends Endpoint {
  constructor() {
    super(HttpRequestType.PATCH, '/:id/users/:userID');
  }

  createRequestSchema = (): Joi.ObjectSchema => Joi.object({
    params: {
      id: Joi.string().custom(validateObjectID).required(),
      userID: Joi.string().custom(validateObjectID).required(),
    },
    body: {
      role: Joi.number().min(0).max(USER_ROLES_NUM).required(),
    },
    headers: {
      [config.userHeader]: Joi.string().required(),
    },
  })

  requestHandler = async (req: Request, res: Response): Promise<void> => {
    const groupID: string = req.params.id;
    const requesterID = getRequesterIdFromRequest(req);
    const userToAdd: string = req.params.userID;
    const userRole: UserRole = req.body.role;

    await UpdateUserRole.logic(groupID, userToAdd, userRole, requesterID);
    res.sendStatus(204);
  }

  /**
   * update a user role in a group.
   * The function throws an error in the following cases:
   * - The group does not exist.
   * - The user is not in the group.
   * - The requester user does not have permission to add the user.
   * @param groupID - the ID of the group.
   * @param userID - the ID of the user to update.
   * @param userRole - the new role.
   * @param requesterID - the ID of the user requesting the action.
   */
  static async logic(
    groupID: string,
    userID: string,
    userRole = UserRole.Member,
    requesterID: string,
  ): Promise<void> {
    const oldRole = await GroupRepository.getUserRoleFromGroup(groupID, userID);
    if (oldRole === null) {
      throw new UserIsNotInGroup(userID, groupID);
    }
    await GroupFunctions.verifyUserHasRequiredRole(
      groupID,
      requesterID,
      requiredRole.user.update(oldRole, userRole),
      `update a user permission from ${UserRole[oldRole]} to ${UserRole[userRole]}.`,
    );

    const res = await GroupRepository.updateUserRole(groupID, userID, userRole);
    if (!res) {
      throw new Unexpected(`Unexpected error when updating user ${userID} role ${userRole} to group ${groupID}`);
    }
  }
}
