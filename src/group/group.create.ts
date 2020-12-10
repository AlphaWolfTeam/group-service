import { Request, Response, Router } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from './group.endpoint';
import { IGroup, GroupType } from './utils/group.interface';
import GroupRepository from './utils/group.repository';

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
      header: {
        'X-User-ID': Joi.string(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const group: IGroup = {
      name: req.body.name,
      description: req.body.description,
      users: [],
      type: req.body.type,
      modifiedBy: req.body.requester,
      createBy: req.body.requester,
    };
    const createdGroup: IGroup = await CreateGroup.logic(group);
    res.sendStatus(201).json(createdGroup);
  }

  /**
   * creates a new group
   * @param group - the group to add to the DB
   * @returns the new created group.
   */
  static async logic(group: IGroup): Promise<IGroup> {
    const createdGroup: IGroup = await GroupRepository.create(group);
    return createdGroup;
  }
}
