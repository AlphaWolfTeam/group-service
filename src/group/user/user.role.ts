/**
 * UserRole is an enum that includes all of the possible user roles in a group.
 * The roles are sorted in ascending order, which means that they can be compared
 * by the < > operators.
 * @value Member
 * @value Modifier
 * @value Admin
 */
export enum UserRole {
  Member,
  Modifier,
  Admin,
}

export const USER_ROLES_NUM = Object.keys(UserRole).length;

/**
 * Returns whether a specific role is sufficient for an operation which requires a specific role.
 * Because the user roles are sorted in ascending order, the function just compare them with >=.
 * @param sufficientRole - The specific action's role.
 * @param role - The role in question.
 */
export function isRoleSufficient(sufficientRole: UserRole, role: UserRole): boolean {
  return role >= sufficientRole;
}

/**
 * A map of required user roles on groups by action.
 */
export const requiredRole = {
  delete: UserRole.Admin,
  update: UserRole.Modifier,
  tag: UserRole.Modifier,
  user: {
    add: (role: UserRole) => Math.max(role, UserRole.Modifier), // Must be at least a modifier
    update: (from: UserRole, to: UserRole) => {
      // promotion
      if (from < to) {
        return to;
      }
      // demotion
      return Math.min(from + 1, UserRole.Admin);
    },
    // must have higher permission or if is an admin.
    delete: (role: UserRole) => Math.min(role + 1, UserRole.Admin),
  },
};
