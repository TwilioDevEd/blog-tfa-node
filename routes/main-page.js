'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , buildData = require('../lib/build-data');

// GET /
router.get('/', (req, res) => {
  var data = buildData(req);
  res.render('main_page.pug', data);
});

// POST /
router.post('/', (req, res, next) => {
  User.findByUsername(req.body.username)
  .then((user) => {
    var data = buildData(req);
    if (!user) {
      data.opts.invalidUsernameOrPassword = true;
      res.render('main_page.pug', data);
    } else {
      user.validatePassword(req.body.password, (err, isValid) => {
        if (!isValid) {
          data.opts.invalidUsernameOrPassword = true;
          res.render('main_page.pug', data);
        } else if (user.totpEnabledViaSms || user.totpEnabledViaApp) {
          req.session.username = user.username;
          req.session.stage = 'password-validated';
          res.redirect('/verify-tfa/');
        } else {
          req.session.user = user;
          res.redirect('/user/');
        }
      });
    }
  })
  .catch((err) => next(err));
});

module.exports = router;
