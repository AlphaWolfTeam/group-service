import { Request, Response } from 'express';
import * as Joi from 'joi';
import config from '../../../config';
import Endpoint, { getRequesterIdFromRequest, HttpRequestType } from '../../../utils/endpoint';
import { Unexpected } from '../../../utils/errors/server.error';
import { validateObjectID } from '../../../utils/joi';
import GroupRepository from '../../group.repository';
import GroupFunctions from '../../group.sharedFunctions';
import { requiredRole } from '../../user/user.role';

export default class RemoveTagFromGroup extends Endpoint {

  constructor() {
    super(HttpRequestType.DELETE, '/:id/tags/:label');
  }

  createRequestSchema(): Joi.ObjectSchema {
    return Joi.object({
      params: {
        id: Joi.string().custom(validateObjectID).required(),
        label: Joi.string().min(config.tagLengthMin).required(),
      },
      headers: {
        [config.userHeader]: Joi.string().required(),
      },
    });
  }

  async requestHandler(req: Request, res: Response): Promise<void> {
    const groupID: string = req.params['id'];
    const requesterID = getRequesterIdFromRequest(req);
    const tag: string = req.params['label'];

    await RemoveTagFromGroup.logic(groupID, tag, requesterID);
    res.sendStatus(204);
  }

  /**
   * removes a tag from a group.
   * The function throws an error in the following cases:
   * - The group does not exist.
   * - The requester user does not have permission to remove the tag.
   * @param groupID - the ID of the group.
   * @param tag - the label of the tag to delete.
   * @param requesterID - the ID of the user requesting the action.
   */
  static async logic(
    groupID: string,
    tag: string,
    requesterID: string): Promise<void> {

    await GroupFunctions.verifyUserHasRequiredRole(
      groupID,
      requesterID,
      requiredRole.tag,
      `remove a tag from the group ${groupID}.`,
      );

    const res = await GroupRepository.removeTag(groupID, tag);
    if (!res) {
      throw new Unexpected(`Unexpected error when deleting a tag from the group ${groupID}`);
    }
  }
}
