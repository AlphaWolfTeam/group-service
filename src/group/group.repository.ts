import { ObjectID } from 'mongodb';
import { IGroup, IGroupPrimal, GroupType } from './group.interface';
import { groupModel } from './group.model';
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
    return groupModel.findByIdAndRemove({ _id: id }).exec();
  }

  /**
   * Gets a group by its id.
   * @param id - the id of the group.
   * @returns a Group object or null if the group is not found.
   */
  static getById(id: string): Promise<IGroup | null> {
    return groupModel.findById({ _id: id }).exec();
  }

  /**
   * Finds public groups by partial name using regex.
   * @param partialName - the partial name of the group.
   */
  static searchPublicByName(partialName: string): Promise<IGroup[]> {
    return groupModel.find({ name: { $regex: partialName, $options: 'i' }, type: GroupType.Public }).exec();
  }

  /**
   * Finds private groups by user ID and partial name using regex.
   * @param partialName - the partial name of the group.
   */
  static searchPrivateByNameAndUser(userID: string, partialName: string): Promise<IGroup[]> {
    return groupModel.find({
      name: { $regex: partialName, $options: 'i' },
      type: GroupType.Private,
      'users.id': userID,
    }).exec();
  }

  /**
   * Gets a groups of a user by his ID.
   * @param userID - the user ID.
   */
  static getGroupsOfUser(userID: string): Promise<IGroup[]> {
    return groupModel.find({ 'users.id': userID }).exec();
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
   * Return a user's role in a group.
   * @param groupID - the ID of the group.
   * @param userID - the ID of the user.
   * @returns the user's role in the group, or null in the following cases:
   * - The user is not in the group
   * - The group does not even exist
   */
  static async getUserRoleFromGroup(groupID: string, userID: string): Promise<UserRole | null> {

    const group = await groupModel
      .findOne({ _id: groupID, 'users.id': userID }, { 'users.$': 1 })
      .exec();

    if (!group?.users) {
      return null;
    }

    return group.users[0].role;
  }

  /**
   * Adds a tag to a group if its not already in the group.
   * @param groupID - the groupID to add the tag to.
   * @param label  - the tag label to add.
   *
   * @returns - wether the tag was successfully added.
   */
  static async addTag(groupID: string, label: string): Promise<boolean> {
    const res = await groupModel.updateOne(
      { _id: groupID },
      { $addToSet: { tags: { label } } }).exec();
    return res.n === 1 && res.nModified === 1 && res.ok === 1;
  }

  /**
   * Removes a tag from a group.
   * @param groupID - the groupID to remove the tag from.
   * @param label  - the label of the tag to remove .
   *
   * @returns - wether the tag was successfully added.
   */
  static async removeTag(groupID: string, label: string): Promise<boolean> {
    const res = await groupModel.updateOne(
      { _id: groupID },
      { $pull: { tags: { label } } }).exec();
    return res.n === 1 && res.nModified === 1 && res.ok === 1;
  }
}
