'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , buildData = require('../lib/build-data');

// GET /
router.get('/', (req, res, next) => {
  var data = buildData(req);
  res.render('main_page.jade', data);
});

// POST /
router.post('/', (req, res, next) => {
  User.findByUsername(req.body.username)
  .then((user) => {
    var data = buildData(req);
    if (!user) {
      data.opts['invalid_username_or_password'] = true;
      res.render('main_page.jade', data);
    } else {
      user.validatePassword(req.body.password, (err, isValid) => {
        if (!isValid) {
          data.opts['invalid_username_or_password'] = true;
          res.render('main_page.jade', data);
        } else {
          if (user['totp_enabled_via_sms'] || user['totp_enabled_via_app']) {
            req.session.username = user.username;
            req.session.stage = 'password-validated';
            res.redirect('/verify-tfa/');
          } else {
            req.session.user = user;
            res.redirect('/user/');
          }
        }
      });
    }
  })
  .catch((err) => next(err));
});

module.exports = router;
