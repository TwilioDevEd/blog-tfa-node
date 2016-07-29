module.exports = (req) => {
  return {
    opts: {
      user: req.session.user,
      isAuthenticated: req.session.user !== undefined
    }
  };
};

