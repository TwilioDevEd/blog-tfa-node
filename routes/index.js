'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user'); 

router.get('/', function(req, res, next) {
  var data = { 
    opts: {
      user: {}
    } 
  };
  res.render('main_page.jade', data);
});

router.post('/', function(req, res, next) {
  User.findOne({
    'username': req.body.username
  }, function (err, user) {
    var data = { 
      opts: {
        user: {}
      } 
    };
    if (!user) {
      data.opts['invalid_username_or_password'] = true;
      res.render('main_page.jade', data);
    } else {
      user.validatePassword(req.body.password, function(err, isValid) {
        if (!isValid) {
          data.opts['invalid_username_or_password'] = true;
          res.render('main_page.jade', data);
        } else {
          if (user['totp_enabled_via_sms'] || user['totp_enabled_via_app']) {
            req.session.username = user.username;
            req.session.stage = 'password-validated';
            res.redirect('/verify_tfa/');
          } else {
            //do login user 
            res.redirect('/user/');  
          }
          
        }
      });
    }
  });
  
});

module.exports = router;
