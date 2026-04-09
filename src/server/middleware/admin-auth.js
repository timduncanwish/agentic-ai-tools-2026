const ADMIN_KEY = process.env.ADMIN_KEY;

function requireAdminKey(req, res, next) {
  if (!ADMIN_KEY) {
    console.warn('WARNING: ADMIN_KEY not set — admin routes are unprotected');
    return next();
  }

  const headerKey = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const queryKey = req.query.key || '';

  if (headerKey === ADMIN_KEY || queryKey === ADMIN_KEY) {
    return next();
  }

  res.status(401).json({ error: 'Unauthorized — provide ADMIN_KEY via Authorization header or ?key= param' });
}

module.exports = { requireAdminKey };
