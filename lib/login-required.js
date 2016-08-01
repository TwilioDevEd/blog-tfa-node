'use strict';

var buildData = require('./build-data');

module.exports = (req, res, next) => {
  var data = buildData(req);
  if (!data.opts.isAuthenticated) {
    console.log('Not authorized, redirecting to /');
    res.redirect('/');
  } else {
    next();
  }
};