module.exports = {
  isAdmin: (req, res, next) => {
    if (req.session.user && req.session.user.role === 2) return next();
    return res.redirect('/login');
  },
  isStaff: (req, res, next) => {
    if (req.session.user && req.session.user.role === 1) return next();
    return res.redirect('/login');
  },
  isClient: (req, res, next) => {
    if (req.session.user && req.session.user.role === 7) return next();
    return res.redirect('/login');
  }
};
