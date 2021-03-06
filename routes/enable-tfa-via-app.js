'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , loginRequired = require('../lib/login-required')
  , buildData = require('../lib/build-data');

// GET /enable-tfa-via-app
router.get('/', loginRequired, (req, res) => {
  var data = buildData(req);
  res.render('enable_tfa_via_app.pug', data);
});

// POST /enable-tfa-via-app
router.post('/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  var token = req.body.token;
  User.findByUsername(data.opts.user.username)
  .then((user) => {
    if (token && user.validateToken(token)) {
      User.update({username: user.username}, {totpEnabledViaApp: true})
      .then((updatedUser) => {
        req.session.user.totpEnabledViaApp = true;
        data.opts.user = req.session.user;
        res.render('enable_tfa_via_app.pug', data);
      })
      .catch((updateErr) => next(updateErr));
    } else {
      data.opts.tokenError = true;
      res.render('enable_tfa_via_app.pug', data);
    }
  })
  .catch((err) => next(err));
});

module.exports = router;
