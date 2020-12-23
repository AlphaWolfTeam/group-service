import { ObjectID } from 'mongodb';
import { IGroup, IGroupPrimal } from './group.interface';
import { groupModel } from './group.model';
import { UserIsNotInGroup } from '../utils/errors/client.error';
import { UserRole } from './user/user.role';

/**
 * The repository connects the group-service with the mongo DB.
 * It is the 'lowest' level of code before making changes in the database or retrieving information from it.
 */
export default class GroupRepository {
  /**
   * Adds a given group to the DB.
   * @param group - is the group to be added to the DB
   */
  static create(group: IGroupPrimal): Promise<IGroup> {
    return groupModel.create(group);
  }

  /**
   * Updates the group metadata by its id.
   * @param id - the group id.
   * @param partialGroup - the partial group containing the attributes to be changed.
   * @returns a promise of the new created group
   */
  static async updateById(_id: string, partialGroup: Partial<IGroup>): Promise<IGroup> {
    return groupModel.findByIdAndUpdate(
      _id,
      { $set: partialGroup },
      { runValidators: true, lean: true, new: true },
      ).exec();
  }

  /**
   * Deletes a group from the DB.
   * @param id - the id of the group to be deleted.
   */
  static deleteById(id: string): Promise<IGroup | null> {
    return groupModel.findByIdAndRemove({ _id: new ObjectID(id) }).exec();
  }

  /**
   * Gets a group by its id.
   * @param id - the id of the group.
   */
  static getById(id: string): Promise<IGroup | null> {
    return groupModel.findById({ _id: new ObjectID(id) }).exec();
  }

  /**
   * Finds groups by partial name using regex.
   * @param partialName - the partial name of the group.
   */
  static searchByName(partialName: string): Promise<IGroup[]> {
    return groupModel.find({ name: { $regex: partialName } }).exec();
  }

  /**
   * Gets a groups of a user by his ID.
   * @param userID - the user ID.
   */
  static getGroupsOfUser(userID: string): Promise<IGroup[]> {
    return groupModel.find({
      users: {
        $elemMatch: {
          id: userID,
        },
      },
    }).exec();
  }

  /**
   * Adds a user to a group, only if he is not already in the group (by userID).
   * @param groupID - the groupID to add the user to.
   * @param userID  - the user ID to add to the group.
   * @param role    - the role of the user in the group.
   *
   * @returns - wether the group was modified successfully.
   */
  static async addUser(groupID: string, userID: string, role: UserRole): Promise<boolean> {
    const res = await groupModel.updateOne(
      { _id: groupID, 'users.id': { $ne: userID } },
      { $push: { users: { role, id: userID } } }).exec();
    return res.n === 1 && res.nModified === 1 && res.ok === 1;
  }

  /**
   * Updates a user role in a group.
   * @param groupID - the groupID in which the user is in.
   * @param userID  - the relevant user ID.
   * @param role    - the new role of the user in the group.
   *
   * @returns - wether the group was modified successfully.
   */
  static async updateUserRole(groupID: string, userID: string, role: UserRole): Promise<boolean> {
    const res = await groupModel.updateOne({ _id: groupID, 'users.id': userID }, { $set: { 'users.$.role': role } }).exec();
    return res.n === 1 && res.nModified === 1 && res.ok === 1;
  }

  /**
   * Removes a user from a group
   * @param groupID - the groupID to delete the user from.
   * @param userID  - the ID of the user to delete.
   *
   * @returns - wether the group was deleted successfully.
   */
  static async removeUser(groupID: string, userID: string): Promise<boolean> {
    const res = await groupModel.updateOne(
      {
        _id: groupID,
      },
      {
        $pull:
        {
          users:
          {
            id: userID,
          },
        },
      }).exec();
    return res.n === 1 && res.nModified === 1 && res.ok === 1;
  }

   /**
   * Gets a users role in a group.
   * The function throws an error when:
   * - The user is not in the group
   * - The group does not even exist
   * @param groupID - the ID of the group.
   * @param userID - the ID of the user.
   * @returns the user's role in the group.
   */
  static async getUserRoleFromGroup(groupID: string, userID: string): Promise<UserRole> {

    const group = await groupModel
      .findOne({ _id: groupID, 'users.id': userID }, { 'users.$': 1 })
      .exec();

    if (!group?.users) {
      throw new UserIsNotInGroup(userID, groupID);
    }

    return group.users[0].role;
  }
}
