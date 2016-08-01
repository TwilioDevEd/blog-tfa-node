'use strict';

var express = require('express')
  , router = express.Router()
  , User = require('../models/user')
  , loginRequired = require('../lib/login-required')
  , base32 = require('thirty-two')
  , qr = require('qr-image');

// GET /auth-qr-code.png/
router.get('/', loginRequired, (req, res, next) => {
  User.findByUsername(req.session.user.username)
  .then((user) => {
    var encoded = base32.encode(user.totp_secret);
    var encodedForGoogle = encoded.toString().replace(/=/g,'');
    var otpauthUrl = `otpauth://totp/${user.username}?secret=${encodedForGoogle}`;
    var code = qr.image(otpauthUrl, { type: 'png', ec_level: 'H', size: 10, margin: 0 });
    res.setHeader('Content-type', 'image/png');
    code.pipe(res);
  });
});

module.exports = router;
