import { Request, Response } from 'express';
import * as Joi from 'joi';

import config from '../../config';
import Endpoint, { HttpRequestType, getRequesterIdFromRequest } from './group.endpoint';
import { IGroup } from '../group.interface';
import GroupRepository from '../group.repository';
import GroupFunctions from '../group.sharedFunctions';
import { ServerError } from '../../utils/errors/application.error';
import { requiredRole } from '../user/user.role';
import User from '../user/user.interface';
import { validateObjectID } from '../../utils/joi';

export default class DeleteGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.DELETE, '/:id');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID).required(),
      },
      headers: {
        [config.userHeader]: Joi.string().required(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const groupID: string = req.params['id'];
    const requesterID: string = getRequesterIdFromRequest(req);

    const result = await DeleteGroup.logic(groupID, requesterID);
    if (!result) throw new ServerError('Internal error: Group update failed');
    res.status(200).json(result._id);
  }

  /**
   * updates groups values (not including users).
   * Before the update, the function verifies that the group exists.
   * Then also checks that the requester has the permission to do that.
   * @param id - the ID of the group to update.
   * @param partialGroup - the groups fields to update.
   * @param requesterID - The user ID of the requester.
   * @returns wether the group was modified correctly or not.
   */
  static async logic(id: string, requesterID: User['id']): Promise<IGroup | null> {
    await GroupFunctions.verifyUserCanPreformAction(id, requesterID, requiredRole.delete, `delete the group ${id}`);
    return await GroupRepository.deleteById(id);
  }
}
