'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user');

var loginRequired = (req, res, next) => {
  var data = buildData(req);
  if (!data.opts.isAuthenticated) {
    res.redirect('/');
  } else {
    next();
  }
};

var buildData = (req) => {
  return {
    opts: {
      user: req.session.user,
      isAuthenticated: req.session.user !== undefined
    }
  };
};

router.get('/', (req, res, next) => {
  var data = buildData(req);
  res.render('main_page.jade', data);
});

router.get('/logout/', (req, res, next) => {
  req.session.destroy((err) => res.redirect('/'));
});

router.get('/verify-tfa/', (req, res, next) => {
  var data = buildData(req);
  User.sendSms(req.session.username, (user, smsSent) => {
    data.opts['sms_sent'] = smsSent;
    data.opts.user = user;
    res.render('verify_tfa.jade', data);
  });
});

router.get('/user/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  res.render('user.jade', data);
});

router.get('/enable-tfa-via-app/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  data.opts.qrcodeUri = User.qrcodeUri(data.opts.user);
  res.render('enable_tfa_via_app.jade', data);
});

router.get('/enable-tfa-via-sms/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  res.render('enable_tfa_via_sms.jade', data);  
});

router.post('/verify-tfa/', (req, res, next) => {
  var data = buildData(req);
  User.findByUsername(req.session.username)
  .then((user) => {
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
  })
  .catch((err) => next(err));
});

router.post('/enable-tfa-via-sms/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  var phoneNumber = req.body['phone_number'];
  var token = req.body.token;

  User.findByUsername(data.opts.user.username)
  .then((user) => {
    if (phoneNumber) {
      user['phone_number'] = phoneNumber;
      user.save()
      .then((updatedUser) => {
        User.sendSms(user.username, (sentSmsUser, smsSent) => {
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
        res.render('enable_tfa_via_sms.jade', data);
      });
    } else {
      data.opts['token_error'] = true;
      res.render('enable_tfa_via_sms.jade', data);
    }
  })
  .catch((err) => next(err));
});

router.post('/enable-tfa-via-app/', loginRequired, (req, res, next) => {
  var data = buildData(req);
  data.opts.qrcodeUri = User.qrcodeUri(data.opts.user);
  var token = req.body.token;
  User.findByUsername(data.opts.user.username)
  .then((user) => {
    if (token && user.validateToken(token)) {
      user.totp_enabled_via_app = true;
      User.update(user, (err, result) => {
        data.opts.user = user;
        res.render('enable_tfa_via_app.jade', data);
      });
    } else {
      data.opts['token_error'] = true;
      res.render('enable_tfa_via_app.jade', data);
    }
  })
  .catch((err) => next(err));
});

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

router.post('/sign-up/', (req, res, next) => {
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
      User.buildAndCreate(req.body.username, req.body.password1, (err, user) => {
        req.session.user = user;
        res.redirect('/user/');
      });
    }
  })
  .catch((err) => next(err));
});

module.exports = router;
