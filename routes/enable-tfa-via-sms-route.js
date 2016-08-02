'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , sendSms = require('../lib/sms-sender')
  , loginRequired = require('../lib/login-required')
  , buildData = require('../lib/build-data');

// GET /enable-tfa-via-sms/
router.get('/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  res.render('enable_tfa_via_sms.pug', data);  
});

// POST //enable-tfa-via-sms/
router.post('/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  var phoneNumber = req.body.phoneNumber;
  var token = req.body.token;

  User.findByUsername(data.opts.user.username)
  .then((user) => {
    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
      user.save()
      .then((updatedUser) => {
        sendSms(user.username, (sentSmsUser, smsSent) => {
          data.opts.user = sentSmsUser;
          data.opts.smsSent = smsSent;
          data.opts.phoneNumber_updated = true;
          res.render('enable_tfa_via_sms.pug', data);
        });
      })
      .catch((err) => next(err));
    } else if (token && user.validateToken(token)) {
      user.totpEnabledViaSms = true;
      user.save((err, result) => {
        data.opts.user = user;
        req.session.user = user;
        res.render('enable_tfa_via_sms.pug', data);
      });
    } else {
      data.opts.tokenError = true;
      res.render('enable_tfa_via_sms.pug', data);
    }
  })
  .catch((err) => next(err));
});

module.exports = router;
