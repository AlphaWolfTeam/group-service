import { Request, Response } from 'express';
import * as Joi from 'joi';
import config from '../../config';
import Endpoint, { HttpRequestType } from '../../utils/endpoint';
import { CannotAccessGroup, GroupNotFound } from '../../utils/errors/client.error';
import { validateObjectID } from '../../utils/joi';
import { GroupType, IGroup } from '../group.interface';
import GroupRepository from '../group.repository';
import GroupFunctions from '../group.sharedFunctions';

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

  async requestHandler(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const requesterID = req.header(config.userHeader);

    const group: IGroup = await GetGroupByID.logic(id, requesterID);
    res.status(200).json(group);
  }

  /**
   * Gets a group by its ID. If the group is private the requester must be in the group in order to get it's info.
   * @param id - the requested group ID.
   * @param requesterID - The requester ID - optional.
   * @returns the requested group.
   * @throws GroupNotFound if the group does not exist.
   * @throws CannotAccessGroup if the group is private and the user is not in the group.
   */
  static async logic(id: string, requesterID?: string): Promise<IGroup>  {
    const group = await GroupRepository.getById(id);
    if (!group) throw new GroupNotFound(id);

    if (group.type === GroupType.Private) {
      if (!requesterID || !GroupFunctions.isUserInGroup(id, requesterID)) {
        throw new CannotAccessGroup(group._id, requesterID);
      }
    }

    return group;
  }

}
