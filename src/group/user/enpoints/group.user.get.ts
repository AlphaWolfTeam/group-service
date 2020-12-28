import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from '../../endpoints/group.endpoint';
import { validateObjectID } from '../../../utils/joi';
import User from '../user.interface';
import GetGroupByID from '../../endpoints/group.getByID';
import config from '../../../config';

export default class GetUsersOfGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.GET, '/:id/users');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID),
      },
      headers: {
        [config.userHeader]: Joi.string(),
      },
    });
  }

  async requestHandler(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const users: User[] = await GetUsersOfGroup.logic(id);
    res.status(200).json(users);
  }

  static async logic(id: string, requesterID?: string): Promise<User[]>  {
    const group = await GetGroupByID.logic(id, requesterID);
    return group.users;
  }

}
