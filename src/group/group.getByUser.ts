import { Request, Response, Router } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from './group.endpoint';
import { IGroup } from './utils/group.interface';
import GroupRepository from './utils/group.repository';

export default class GetGroupByUserID extends Endpoint {

  constructor() {
    super(HttpRequestType.GET, '/users/:id');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      query: {},
      body: {},
      params: {
        id: Joi.string().lowercase().required(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const userID = req.params.id;
    const groups: IGroup[] = await GetGroupByUserID.logic(userID);
    res.json(groups);
  }

  static async logic(id: string): Promise<IGroup[]>  {
    const groups = await GroupRepository.getGroupsOfUser(id);
    return groups;
  }

}
