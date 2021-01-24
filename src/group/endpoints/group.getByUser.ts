import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from '../../utils/endpoint';
import { IGroup } from '../group.interface';
import GroupRepository from '../group.repository';

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

  async requestHandler(req: Request, res: Response): Promise<void> {
    const userID = req.params.id;
    const groups: IGroup[] = await GetGroupByUserID.logic(userID);
    res.status(200).json(groups);
  }

  static async logic(id: string): Promise<IGroup[]>  {
    const groups = await GroupRepository.getGroupsOfUser(id);
    return groups;
  }

}
