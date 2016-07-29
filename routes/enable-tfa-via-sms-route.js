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
  res.render('enable_tfa_via_sms.jade', data);  
});

// POST //enable-tfa-via-sms/
router.post('/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  var phoneNumber = req.body['phone_number'];
  var token = req.body.token;

  User.findByUsername(data.opts.user.username)
  .then((user) => {
    if (phoneNumber) {
      user['phone_number'] = phoneNumber;
      user.save()
      .then((updatedUser) => {
        sendSms(user.username, (sentSmsUser, smsSent) => {
          data.opts.user = sentSmsUser;
          data.opts['sms_sent'] = smsSent;
          data.opts['phone_number_updated'] = true;
          res.render('enable_tfa_via_sms.jade', data);
        });
      })
      .catch((err) => next(err));
    } else if (token && user.validateToken(token)) {
      user.totp_enabled_via_sms = true;
      user.save((err, result) => {
        data.opts.user = user;
        req.session.user = user;
        res.render('enable_tfa_via_sms.jade', data);
      });
    } else {
      data.opts['token_error'] = true;
      res.render('enable_tfa_via_sms.jade', data);
    }
  })
  .catch((err) => next(err));
});

module.exports = router;
