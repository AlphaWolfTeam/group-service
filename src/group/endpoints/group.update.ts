import { Request, Response } from 'express';
import * as Joi from 'joi';
import { pickBy } from 'lodash';
import config from '../../config';
import Endpoint, { getRequesterIdFromRequest, HttpRequestType } from '../../utils/endpoint';
import { validateObjectID } from '../../utils/joi';
import { GroupType, IGroup } from '../group.interface';
import GroupRepository from '../group.repository';
import GroupFunctions from '../group.sharedFunctions';
import User from '../user/user.interface';
import { requiredRole } from '../user/user.role';

export default class UpdateGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.PATCH, '/:id');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      body: {
        name: Joi.string(),
        description: Joi.string(),
        icon: Joi.binary().encoding('base64'),
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

  async requestHandler(req: Request, res: Response): Promise<void> {
    const groupID: string = req.params['id'];
    const requesterID = getRequesterIdFromRequest(req);

    let partialGroup: Partial<IGroup> = {
      name: req.body.name,
      description: req.body.description,
      icon: req.body.icon,
      type: req.body.type,
      modifiedBy: requesterID,
    };
    partialGroup = filterOutUndefinedFromGroup(partialGroup);

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
    await GroupFunctions.verifyUserHasRequiredRole(id, requesterID, requiredRole.update, `update group ${id} fields.`);
    return GroupRepository.updateById(id, partialGroup);
  }
}

/**
 * filter out the fields with a undefined value from the object , and returns the new object.
 * @param obj - the object to filter the undefined values from
 */
const filterOutUndefinedFromGroup = <T extends Object>(obj: T): Partial<T> => {
  return pickBy(obj, v => v !== undefined);
};
