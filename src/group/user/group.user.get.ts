import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from '../group.endpoint';
import { GroupNotFound } from '../../utils/errors/client.error';
import GroupFunctions from '../group.sharedFunctions';
import { validateObjectID } from '../../utils/joi';
import User from './user.interface';

export default class GetUsersOfGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.GET, '/:id');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const users: User[] = await GetUsersOfGroup.logic(id);
    res.json(users);
  }

  static async logic(id: string): Promise<User[]>  {
    const group = await GroupFunctions.findGroupByID(id);
    if (!group) throw new GroupNotFound(id);
    return group.users;
  }

}
