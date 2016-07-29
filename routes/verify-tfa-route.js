'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , sendSms = require('../lib/sms-sender')
  , buildData = require('../lib/build-data');

// GET /verify-tfa/
router.get('/', (req, res, next) => {
  var data = buildData(req);
  sendSms(req.session.username, (user, smsSent) => {
    data.opts.sms_sent = smsSent;
    data.opts.user = user;
    res.render('verify_tfa.jade', data);
  });
});

// POST /verify-tfa/
router.post('/', (req, res, next) => {
  var data = buildData(req);
  User.findByUsername(req.session.username)
  .then((user) => {
    data.opts.user = user;
    if (req.session.username === undefined) {
      data.opts.errorNoUsername = true;
      res.render('verify_tfa.jade', data);
    } else if (req.session.stage !== 'password-validated') {
      data.opts.errorUnverifiedPassword = true;
      res.render('verify_tfa.jade', data); 
    } else {
      var token = req.body.token;
      if (token && user.validateToken(token)) {
        req.session.user = user;
        req.session.stage = 'logged-in';
        res.redirect('/user/');
      } else {
        data.opts.errorInvalidToken = true;
        res.render('verify_tfa.jade', data);
      }
    }
  })
  .catch((err) => next(err));
});
  
module.exports = router;
