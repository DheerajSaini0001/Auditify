/**
 * Determines the redirection path based on user role.
 * 
 * Redirection Mapping:
 * - super_admin -> /admin/setup (Super Admin Dashboard / Configuration)
 * - admin       -> /admin       (Admin Dashboard)
 * - user        -> /            (Home for normal users)
 * 
 * @param {string} role - The user's role (super_admin, admin, user)
 * @returns {string} The path to redirect to.
 */
export const getRedirectPath = (role) => {
  switch (role) {
    case 'super_admin':
      return '/admin/setup';
    case 'admin':
      return '/admin';
    case 'user':
      return '/dashboard';
    default:
      return '/';
  }
};
