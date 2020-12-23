import { Request, Response } from 'express';
import * as Joi from 'joi';
import { pickBy } from 'lodash';

import config from '../../config';
import Endpoint, { HttpRequestType, getRequesterIdFromRequest } from './group.endpoint';
import GroupFunctions from '../group.sharedFunctions';
import { IGroup, GroupType } from '../group.interface';
import GroupRepository from '../group.repository';

import { requiredRole } from '../user/user.role';
import User from '../user/user.interface';

import { validateObjectID } from '../../utils/joi';
import { Unexpected } from '../../utils/errors/server.error';

export default class UpdateGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.PUT, '/:id');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      body: {
        name: Joi.string(),
        description: Joi.string(),
        type: Joi.string().valid(...Object.values(GroupType)),
      },
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
    let partialGroup: Partial<IGroup> = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
    };
    // Take only the fields that are not undefined.
    partialGroup = pickBy(partialGroup, v => v !== undefined);

    const requesterID = getRequesterIdFromRequest(req);

    const result = await UpdateGroup.logic(groupID, partialGroup, requesterID);
    res.status(200).json(result);
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
  static async logic(id: string, partialGroup: Partial<IGroup>, requesterID: User['id']): Promise<IGroup> {
    await GroupFunctions.verifyUserCanPreformAction(id, requesterID, requiredRole.update, `update group ${id} fields.`);
    partialGroup.modifiedBy = requesterID;
    try {
      return await GroupRepository.updateById(id, partialGroup);
    } catch (err) {
      throw new Unexpected(`Unexpected mongoose error while updating group: ${err.message}`);
    }
  }
}
