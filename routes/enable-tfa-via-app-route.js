'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , loginRequired = require('../lib/login-required')
  , buildData = require('../lib/build-data');

// GET /enable-tfa-via-app/
router.get('/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  data.opts.qrcodeUri = User.qrcodeUri(data.opts.user);
  res.render('enable_tfa_via_app.jade', data);
});

// POST /enable-tfa-via-app/
router.post('/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  data.opts.qrcodeUri = User.qrcodeUri(data.opts.user);
  var token = req.body.token;
  User.findByUsername(data.opts.user.username)
  .then((user) => {
    if (token && user.validateToken(token)) {
      user.totp_enabled_via_app = true;
      User.update(user, (err, result) => {
        data.opts.user = user;
        res.render('enable_tfa_via_app.jade', data);
      });
    } else {
      data.opts['token_error'] = true;
      res.render('enable_tfa_via_app.jade', data);
    }
  })
  .catch((err) => next(err));
});

module.exports = router;
