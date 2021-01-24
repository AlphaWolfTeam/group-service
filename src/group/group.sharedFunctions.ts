import { GroupNotFound, UserCannotPreformActionOnGroup } from '../utils/errors/client.error';
import GroupRepository from './group.repository';
import { IGroup } from './group.interface';
import { UserRole, isRoleSufficient } from './user/user.role';

export default class GroupFunctions {
  /**
   * Checks if a user is in a group.
   * @param groupID - the ID of the group.
   * @param userID - the ID of the user.
   * @returns whether the user is in the group.
   */
  static async isUserInGroup(groupID: string, userID: string): Promise<boolean> {
    const role = await GroupRepository.getUserRoleFromGroup(groupID, userID);
    return (role !== null);
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
  static async verifyUserHasRequiredRole(
    groupID: string,
    userID: string,
    requiredRole: UserRole,
    actionDescription?: string,
  ): Promise<void> {
    const usersRole = await GroupRepository.getUserRoleFromGroup(groupID, userID);

    if (usersRole === null) {
      const group: IGroup | null = await GroupRepository.getById(groupID);
      if (!group) {
        throw new GroupNotFound(groupID);
      }
      throw new UserCannotPreformActionOnGroup(groupID, userID, 'the user is not in the group');
    }
    if (!isRoleSufficient(requiredRole, usersRole)) {
      const actionMessage = actionDescription ? `when trying to ${actionDescription}.` : '.';
      throw new UserCannotPreformActionOnGroup(
        groupID,
        userID,
        `the user has a ${usersRole} role, but needs a ${requiredRole} role ${actionMessage}`,
      );
    }
  }
}
