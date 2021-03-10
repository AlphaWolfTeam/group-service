import { Request, Response } from 'express';
import * as Joi from 'joi';
import config from '../../config';
import Endpoint, {
  getRequesterIdFromRequest,
  HttpRequestType,
} from '../../utils/endpoint';
import { GroupType, IGroup, IGroupPrimal } from '../group.interface';
import IUser from '../user/user.interface';
import GroupRepository from '../group.repository';
import { UserRole, USER_ROLES_NUM } from '../user/user.role';
import { validateObjectID } from '../../utils/joi';

export default class CreateGroup extends Endpoint {
  constructor() {
    super(HttpRequestType.POST, '/');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      body: {
        name: Joi.string().required(),
        description: Joi.string().required(),
        users: Joi.array()
          .items({
            id: Joi.string().custom(validateObjectID).required(),
            role: Joi.number().min(0).max(USER_ROLES_NUM).required(),
          }),
        type: Joi.string().valid(...Object.values(GroupType)),
        tags: Joi.array().items({
          label: Joi.string().required(),
        }).unique(),
        icon: Joi.binary().encoding('base64'),
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
      users: addRequesterAsAdmin(req.body.users || [], requesterID),
      tags: req.body.tags || [],
      icon: req.body.icon,
      type: req.body.type || GroupType.Public,
      modifiedBy: requesterID,
      createdBy: requesterID,
    };
  }

  /**
   * creates a new group.
   * @param group - the group to add to the DB.
   * @returns the new created group.
   */
  static async logic(group: IGroupPrimal): Promise<IGroup> {
    const createdGroup: IGroup = await GroupRepository.create(group);
    return createdGroup;
  }
}

/**
 * sets the requester as a manager in the users array.
 * @param users - An array of users.
 * @param requesterId - An id of the requester.
 * @returns an array of users with requester.
 */
const addRequesterAsAdmin = (users: IUser[], requesterId: string): IUser[] => {
  return users.some((user: IUser) => user.id === requesterId)
    ? users.map((user: IUser) => user.id === requesterId ? { id: requesterId, role: UserRole.Admin } : user)
    : [...users, { id: requesterId, role: UserRole.Admin }];
};
