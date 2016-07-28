'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user'); 

router.get('/', function(req, res, next) {
  var data = emptyData();
  res.render('main_page.jade', data);
});

router.post('/', function(req, res, next) {
  User.findOne({
    'username': req.body.username.toLowerCase()
  }, function (err, user) {
    var data = emptyData();
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
            loginUser(user, req);
            res.redirect('/user/');  
          }
        }
      });
    }
  });
});

router.get('/', function(req, res, next) {
  var data = emptyData();
  res.render('main_page.jade', data);
});

router.post('/sign-up/', function(req, res, next) {
  var data = emptyData();
  User.findOne({
    'username': req.body.username.toLowerCase()
  }, function (err, result) {
    if (result) {
      data.opts['username_exists'] = true;
      res.render('sign_up.jade', data);
    } else if (req.body.password1 != req.body.password2) {
      data.opts['passwords_do_not_match'] = true;
      res.render('sign_up.jade', data);
    } else {
      User.build(req.body.username, req.body.password1, function(user) {
        User.create(user, function(err, user) {
          loginUser(user, req);
          res.redirect('/user/');
        });  
      });
    }
  });
});

var loginUser = function(user, req) {
  //TODO
};

var emptyData = function() {
  return { 
    opts: {
      user: {}
    } 
  };
}

module.exports = router;
