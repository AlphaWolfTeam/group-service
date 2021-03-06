import { Request, Response } from 'express';
import * as Joi from 'joi';
import config from '../../../config';
import Endpoint, { HttpRequestType } from '../../../utils/endpoint';
import { validateObjectID } from '../../../utils/joi';
import GetGroupByID from '../../endpoints/group.getByID';
import IUser from '../user.interface';

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
    const requesterID = req.header(config.userHeader);
    const users: IUser[] = await GetUsersOfGroup.logic(id, requesterID);
    res.status(200).json(users);
  }

  static async logic(id: string, requesterID?: string): Promise<IUser[]>  {
    const group = await GetGroupByID.logic(id, requesterID);
    return group.users;
  }

}
