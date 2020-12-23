import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from './group.endpoint';
import { IGroup, GroupType } from '../group.interface';
import { GroupNotFound, CannotAccessGroup } from '../../utils/errors/client.error';
import GroupFunctions from '../group.sharedFunctions';
import { validateObjectID } from '../../utils/joi';
import config from '../../config';

export default class GetGroupByID extends Endpoint {

  constructor() {
    super(HttpRequestType.GET, '/:id');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID).required(),
      },
      headers: {
        [config.userHeader]: Joi.string(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const requesterID = req.header(config.userHeader);

    const group: IGroup = await GetGroupByID.logic(id, requesterID);
    res.json(group);
  }

  /**
   * Gets a group by its ID. If the group is private the requester must be in the group in order to get it's info.
   * @param id - the requested group ID.
   * @param requesterID - The requestor ID - optional.
   * @returns the requested group.
   * @throws GroupNotFound if the group does not exist.
   * @throws CannotAccessGroup if the group is private and the user is not in the group.
   */
  static async logic(id: string, requesterID?: string): Promise<IGroup>  {
    const group = await GroupFunctions.findGroupByID(id);
    if (!group) throw new GroupNotFound(id);

    if (group.type === GroupType.Private && !(requesterID && GroupFunctions.isUserInGroup(id, requesterID))) {
      throw new CannotAccessGroup(group._id, requesterID);
    }
    return group;
  }

}
