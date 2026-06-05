/**
 * Determines the redirection path based on user role.
 * 
 * Redirection Mapping:
 * - super_admin -> /admin/setup (Super Admin Dashboard / Configuration)
 * - admin       -> /admin       (Admin Dashboard)
 * - user        -> /dashboard   (User dashboard)
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
      // Must NOT be '/', which is itself a GuestRoute — returning '/' for an
      // authenticated user with an unknown/missing role causes an infinite redirect loop.
      return '/dashboard';
  }
};
