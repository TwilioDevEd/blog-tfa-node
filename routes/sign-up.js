'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , buildData = require('../lib/build-data');

// GET /sign-up
router.get('/', (req, res) => {
  var data = buildData(req);
  res.render('sign_up.pug', data);
});

// POST /sign-up
router.post('/', (req, res, next) => {
  var data = buildData(req);
  User.findByUsername(req.body.username)
  .then((result) => {
    if (result) {
      data.opts.usernameExists = true;
      res.render('sign_up.pug', data);
    } else if (req.body.password1 != req.body.password2) {
      data.opts.passwordsDoNotMatch = true;
      res.render('sign_up.pug', data);
    } else {
      User.buildAndCreate(req.body.username, req.body.password1, (user) => {
        req.session.user = user;
        res.redirect('/user/');
      });
    }
  })
  .catch((err) => next(err));
});

module.exports = router;
