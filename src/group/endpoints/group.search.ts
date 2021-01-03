import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from '../../utils/endpoint';
import { InvalidArgument } from '../../utils/errors/client.error';
import { IGroup, GroupType } from '../group.interface';
import GroupRepository from '../group.repository';
import config from '../../config';

export default class SearchGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.GET, '/');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      query: {
        partial: Joi.string().min(config.searchQueryLengthMin).required(),
        type: Joi.string().valid(...Object.values(GroupType)),
      },
      headers: {
        [config.userHeader]: Joi.string(),
      },
    });
  }

  async requestHandler(req: Request, res: Response): Promise<void> {
    const partial = req.query.partial;
    if (typeof(partial) !== 'string') throw new InvalidArgument('partial should be a string');

    const type = req.query.type || GroupType.Public;
    if (!isSomeEnum(GroupType)(type)) throw new InvalidArgument('invalid group type');

    const requesterID = req.header(config.userHeader);

    const groups: IGroup[] = await SearchGroup.logic(partial, type, requesterID);
    res.status(200).json(groups);
  }

  static async logic(partial: string, type: GroupType, userID?: string): Promise<IGroup[]>  {
    switch (type) {
      case GroupType.Public:
        return GroupRepository.searchPublicByNameAndTag(partial);
      default: // Private
        if (!userID) {
          throw new InvalidArgument(`requester ID must be sent in the ${config.userHeader} header in order to search on private groups`);

        }
        return GroupRepository.searchPrivate(userID, partial);
    }
  }
}

/**
 * returns a function for a specific enum type that returns weather a token is of that enum.
 * @param e - the enum type.
 */
const isSomeEnum = <T>(e: T) => (token: any): token is T[keyof T] =>
    Object.values(e).includes(token as T[keyof T]);
