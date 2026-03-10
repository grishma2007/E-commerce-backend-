// Middleware: protect routes that require a logged-in session
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorised – please log in" });
};

module.exports = { requireAuth };
