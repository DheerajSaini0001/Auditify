// Admin Authentication Middleware
//
// DEPRECATED: this was a placeholder that called next() unconditionally — i.e. it
// authorized EVERY request. It is not wired into any route (admin routes use
// verifyToken + checkRole('admin') from ./auth.js). It now fails closed so that
// if it is ever mistakenly mounted, it denies access instead of silently allowing it.
//
// Use { verifyToken, checkRole } from './auth.js' for real admin protection.

const adminAuth = (req, res, next) => {
    return res.status(501).json({
        error: 'adminAuth is deprecated. Use verifyToken + checkRole("admin") instead.',
        code: 'ADMIN_AUTH_DISABLED',
    });
};

export default adminAuth;
