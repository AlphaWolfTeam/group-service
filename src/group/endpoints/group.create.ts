import { Request, Response, Router } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType, getRequesterIdFromRequest } from './group.endpoint';
import { IGroup, GroupType, IGroupPrimal } from '../group.interface';
import GroupRepository from '../group.repository';
import config from '../../config';
import { UserRole } from '../user/user.role';

export default class CreateGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.POST, '/');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      body: {
        name: Joi.string().required(),
        description: Joi.string().required(),
        type: Joi.string().valid(...Object.values(GroupType)),
      },
      headers: {
        [config.userHeader]: Joi.string().required(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const requesterID = getRequesterIdFromRequest(req);
    const group: IGroupPrimal = {
      name: req.body.name,
      description: req.body.description,
      users: [{ id: requesterID, role: UserRole.Admin }],
      type: req.body.type || GroupType.Public,
      modifiedBy: requesterID,
      createdBy: requesterID,
    };
    const createdGroup: IGroupPrimal = await CreateGroup.logic(group);
    res.status(201).json(createdGroup);
  }

  /**
   * creates a new group
   * @param group - the group to add to the DB
   * @returns the new created group.
   */
  static async logic(group: IGroupPrimal): Promise<IGroup> {
    const createdGroup: IGroup = await GroupRepository.create(group);
    return createdGroup;
  }
}
