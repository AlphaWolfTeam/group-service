/**
 * UserRole is an enum that includes all of the possible user roles in a group.
 * The roles are sorted in ascending order, which means that they can be compared by the < > operators.
 * @value Member
 * @value Modifier
 * @value Admin
 */
export enum UserRole {
  Member,
  Modifier,
  Admin,
}

/**
 * Returns whether a specific role is sufficient for an operation which requires a specific role.
 * Because the user roles are sorted in ascending order, the function just compare them with >=.
 * @param sufficientRole - The specific action's role.
 * @param role - The role in question.
 */
export function isRoleSufficient(sufficientRole: UserRole, role: UserRole): boolean {
  return role >= sufficientRole;
}

export const requiredRole = {
  delete: UserRole.Admin,
  update: UserRole.Admin,
  user: {
    add: (role: UserRole) => {
      if (role >= UserRole.Modifier) {
        return UserRole.Modifier;
      }
      return role;
    },
    update: (from: UserRole, to: UserRole) => {
      // promotion
      if (from < to) {
        return to;
      }
      // demotion
      if (from === UserRole.Modifier) {
        // only a admin can demote a modifier
        return UserRole.Admin;
      }
      return from;
    },
    delete: (role: UserRole) => {
      // an admin can delete another admin.
      if (role === UserRole.Admin) {
        return role;
      }
      return role + 1;
    },
  },
};
