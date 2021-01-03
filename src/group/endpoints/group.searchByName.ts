import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from '../../utils/endpoint';
import { InvalidArgument } from '../../utils/errors/client.error';
import { IGroup } from '../group.interface';
import GroupRepository from '../group.repository';

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

  async requestHandler(req: Request, res: Response): Promise<void> {
    const partialName = req.query.partialName;

    if (typeof(partialName) !== 'string') {
      // Should never happen because we already have a validation on this parameter.
      throw new InvalidArgument('partialName should be a string');
    }

    const groups: IGroup[] = await SearchGroupByName.logic(partialName);
    res.status(200).json(groups);
  }

  static async logic(partialName: string): Promise<IGroup[]>  {
    const groups: IGroup[] = await GroupRepository.searchByName(partialName);
    return groups;
  }

}
