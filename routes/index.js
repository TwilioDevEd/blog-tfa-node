'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user');

var loginRequired = function(req, res, next) {
  var data = buildData(req);
  if (!data.opts.isAuthenticated) {
    res.redirect('/');
  } else {
    next();
  }
};

var buildData = function(req) {
  return {
    opts: {
      user: req.session.user,
      isAuthenticated: req.session.user !== undefined
    }
  };
};

router.get('/', function(req, res, next) {
  var data = buildData(req);
  res.render('main_page.jade', data);
});

router.get('/logout/', function(req, res, next) {
  req.session.destroy(function(err) {
    res.redirect('/');
  });
});

router.get('/verify-tfa/', function(req, res, next) {
  var data = buildData(req);
  User.sendSms(req.session.username, function(user, smsSent) {
    data.opts['sms_sent'] = smsSent;
    data.opts.user = user;
    res.render('verify_tfa.jade', data);
  });
});

router.get('/user/', loginRequired, function(req, res, next) {
  var data = buildData(req);
  res.render('user.jade', data);
});

router.get('/enable-tfa-via-app/', loginRequired, function(req, res, next) {
  var data = buildData(req);
  data.opts.qrcodeUri = User.qrcodeUri(data.opts.user);
  res.render('enable_tfa_via_app.jade', data);
});

router.get('/enable-tfa-via-sms/', loginRequired, function(req, res, next) {
  var data = buildData(req);
  res.render('enable_tfa_via_sms.jade', data);  
});

router.post('/verify-tfa/', function(req, res, next) {
  var data = buildData(req);
  User.findOne({username: req.session.username}, function(err, user) {
    data.opts.user = user;
    if (req.session.username === undefined) {
      data.opts['user-no-username'] = true;
      res.render('verify_tfa.jade', data);
    } else if (req.session.stage !== 'password-validated') {
      data.opts['error-unverified-password'] = true;
      res.render('verify_tfa.jade', data); 
    } else {
      var token = req.body.token;
      if (token && user.validateToken(token)) {
        req.session.user = user;
        req.session.stage = 'logged-in';
        res.redirect('/user/');
      } else {
        data.opts['error-invalid-token'] = true;
        res.render('verify_tfa.jade', data);
      }
    }
  });
});

router.post('/enable-tfa-via-sms/', loginRequired, function(req, res, next) {
  var data = buildData(req);
  var phoneNumber = req.body['phone_number'];
  var token = req.body.token;

  User.findOne({username: data.opts.user.username}, function(err, user) {
    if (phoneNumber) {
        user['phone_number'] = phoneNumber;
        user.save(function(err, updatedUser) {
          User.sendSms(user.username, function(sentSmsUser, smsSent) {
            data.opts.user = sentSmsUser;
            data.opts['sms_sent'] = smsSent;
            data.opts['phone_number_updated'] = true;
            res.render('enable_tfa_via_sms.jade', data);
          });
        });
    } else if (token && user.validateToken(token)) {
      user.totp_enabled_via_sms = true;
      user.save(function(err, result) {
        data.opts.user = user;
        res.render('enable_tfa_via_sms.jade', data);
      });
    } else {
      data.opts['token_error'] = true;
      res.render('enable_tfa_via_sms.jade', data);
    }
  });
});

router.post('/enable-tfa-via-app/', loginRequired, function(req, res, next) {
  var data = buildData(req);
  data.opts.qrcodeUri = User.qrcodeUri(data.opts.user);
  var token = req.body.token;
  User.findOne({username: data.opts.user.username}, function(err, user) {
    if (token && user.validateToken(token)) {
      user.totp_enabled_via_app = true;
      User.update(user, function(err, result) {
        data.opts.user = user;
        res.render('enable_tfa_via_app.jade', data);
      });
    } else {
      data.opts['token_error'] = true;
      res.render('enable_tfa_via_app.jade', data);
    }
  });
});

router.post('/', function(req, res, next) {
  User.findOne({
    'username': req.body.username.toLowerCase()
  }, function (err, user) {
    var data = buildData(req);
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
            res.redirect('/verify-tfa/');
          } else {
            req.session.user = user;
            res.redirect('/user/');
          }
        }
      });
    }
  });
});

router.post('/sign-up/', function(req, res, next) {
  var data = buildData(req);
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
          req.session.user = user;
          res.redirect('/user/');
        });  
      });
    }
  });
});

module.exports = router;
