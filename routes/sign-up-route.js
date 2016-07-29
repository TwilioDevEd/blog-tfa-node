'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , buildData = require('../lib/build-data');

// GET /sign-up/
router.get('/', (req, res, next) => {
  var data = buildData(req);
  res.render('sign_up.jade', data);
});

// POST /sign-up/
router.post('/', (req, res, next) => {
  var data = buildData(req);
  User.findByUsername(req.body.username)
  .then((result) => {
    if (result) {
      data.opts['username_exists'] = true;
      res.render('sign_up.jade', data);
    } else if (req.body.password1 != req.body.password2) {
      data.opts['passwords_do_not_match'] = true;
      res.render('sign_up.jade', data);
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
