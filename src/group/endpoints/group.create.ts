import { Request, Response } from 'express';
import * as Joi from 'joi';
import config from '../../config';
import Endpoint, { getRequesterIdFromRequest, HttpRequestType } from '../../utils/endpoint';
import { GroupType, IGroup, IGroupPrimal } from '../group.interface';
import GroupRepository from '../group.repository';
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

  async requestHandler(req: Request, res: Response): Promise<void> {
    const group: IGroupPrimal = CreateGroup.extractAndTransform(req);
    const createdGroup: IGroupPrimal = await CreateGroup.logic(group);
    res.status(201).json(createdGroup);
  }

  /**
   * extracts the params from the request, and transform its data to a Primal Group.
   * @param req The http request containing the params.
   * @returns an IGroupPrimal object.
   */
  static extractAndTransform(req: Request): IGroupPrimal {
    const requesterID = getRequesterIdFromRequest(req);
    return {
      name: req.body.name,
      description: req.body.description,
      users: [{ id: requesterID, role: UserRole.Admin }],
      type: req.body.type || GroupType.Public,
      modifiedBy: requesterID,
      createdBy: requesterID,
    };
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
