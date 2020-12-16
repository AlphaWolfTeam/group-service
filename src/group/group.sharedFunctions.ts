import { GroupNotFound, UserCannotPreformActionOnGroup, UserIsNotInGroup } from '../utils/errors/client.error';
import GroupRepository from './utils/group.repository';
import { IGroup } from './utils/group.interface';
import { UserRole, isRoleSufficient } from './user/user.role';

export default class GroupFunctions {

  /**
   * verifies that a group exists. If not throws an error.
   * @param groupID - the group's ID.
   */
  static async verifyGroupExists(groupID: string) {
    const group = await this.findGroupByID(groupID);
    if (!group) throw new GroupNotFound(groupID);
  }

  /**
   * getGroupByID finds a group by its ID.
   * @param id - a group ID.
   * @returns a Group object or null if the group is not found.
   */
  static async findGroupByID(id: string): Promise<IGroup | null>  {
    return await GroupRepository.getById(id);
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
  static async getUserRoleInGroup(groupID: string, userID: string): Promise<UserRole> {
    const role: UserRole = await GroupRepository.getUserRoleFromGroup(groupID, userID);
    return role;
  }

  /**
   * Checks if a user is in a group.
   * Throws an error if the group does not exist.
   * @param groupID - the ID of the group.
   * @param userID - the ID of the user.
   * @returns whether the user is in the group.
   */
  static async isUserInGroup(groupID: string, userID: string): Promise<boolean> {
    try {
      await GroupRepository.getUserRoleFromGroup(groupID, userID);
    } catch (err) {
      if (err instanceof UserIsNotInGroup) {
        return false;
      }
      throw err;
    }
    return true;
  }

  /**
   * Verify that a user can preform an action that requires a role on a group.
   * The function can throw an error in the following cases:
   * - The group does not exist.
   * - The user is not in the group.
   * - The user does not have the minimum role to preform the action.
   * @param groupID - The ID of the group which the user wishes to preform the action on.
   * @param userID - The ID of te user who wants to preform the action.
   * @param requiredRole - The required role of the user.
   * @param actionDescription - a short description of the action for logging purposes.
   */
  static async verifyUserCanPreformAction(groupID: string, userID: string, requiredRole: UserRole, actionDescription?: string): Promise<void> {
    const usersRole = await this.getUserRoleInGroup(groupID, userID);
    if (!isRoleSufficient(requiredRole, usersRole)) {
      const actionMessage = actionDescription ? ` when trying to ${actionDescription}.` : '.';
      throw new UserCannotPreformActionOnGroup(
        groupID,
        userID,
        `the user has a ${usersRole} role, but needs a ${requiredRole} role${actionMessage}`,
        );
    }
  }

}
