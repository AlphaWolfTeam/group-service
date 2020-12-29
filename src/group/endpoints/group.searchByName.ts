import { Request, Response } from 'express';
import * as Joi from 'joi';
import Endpoint, { HttpRequestType } from '../../utils/endpoint';
import { InvalidArgument } from '../../utils/errors/client.error';
import { IGroup, GroupType } from '../group.interface';
import GroupRepository from '../group.repository';
import GroupFunctions from '../group.sharedFunctions';
import config from '../../config';
import { groupModel } from '../group.model';

type Enum = {[s: number]: string};

export default class SearchGroupByName extends Endpoint {

  constructor() {
    super(HttpRequestType.GET, '/');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      query: {
        partialName: Joi.string().min(2).required(),
        type: Joi.string().valid(...Object.values(GroupType)),
      },
      headers: {
        [config.userHeader]: Joi.string(),
      },
    });
  }

  async requestHandler(req: Request, res: Response): Promise<void> {
    const partialName = req.query.partialName;
    if (typeof(partialName) !== 'string') throw new InvalidArgument('partialName should be a string');

    const type = req.query.type || GroupType.Public;
    if (!isSomeEnum(GroupType)(type)) throw new InvalidArgument('invalid group type');

    const requesterID = req.header(config.userHeader);

    const groups: IGroup[] = await SearchGroupByName.logic(partialName, type, requesterID);
    res.status(200).json(groups);
  }

  static async logic(partialName: string, type: GroupType, userID?: string): Promise<IGroup[]>  {
    switch (type) {
      case GroupType.Public:
        return GroupRepository.searchPublicByName(partialName);
      default: // Private
        if (!userID) {
          throw new InvalidArgument(`requester ID must be sent in the ${config.userHeader} header in order to search on private groups`);

        }
        return GroupRepository.searchPrivateByNameAndUser(userID, partialName);
    }
  }
}

/**
 * returns a function for a specific enum type that returns weather a token is of that enum.
 * @param e - the enum type.
 */
const isSomeEnum = <T>(e: T) => (token: any): token is T[keyof T] =>
    Object.values(e).includes(token as T[keyof T]);
