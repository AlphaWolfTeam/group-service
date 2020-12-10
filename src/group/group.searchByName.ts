import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from './group.endpoint';
import { IGroup } from './utils/group.interface';
import GroupRepository from './utils/group.repository';
import { InvalidArgument } from '../utils/errors/client.error';

export default class SearchGroupByName extends Endpoint {

  constructor() {
    super(HttpRequestType.GET, '/');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      query: {
        partialName: Joi.string().min(2).required(),
      },
    });
  }

  async handler(req: Request, res: Response): Promise<void> {
    const partialName = req.query.partialName;

    if (typeof(partialName) !== 'string') {
      // Should never happen because we already have a validation on this parameter.
      throw new InvalidArgument('partialName should be a string');
    }

    const groups: IGroup[] = await SearchGroupByName.logic(partialName);
    res.json(groups);
  }

  static async logic(partialName: string): Promise<IGroup[]>  {
    const groups: IGroup[] = await GroupRepository.searchByName(partialName);
    return groups;
  }

}
