'use strict';

var notp = require('notp')
  , base32 = require('thirty-two')
  , randomBase32 = require('./random-base32');

function TotpAuth(secret) {
  this.secret = secret;

  this.generate = function(time, opt) {
    opt = opt || {};
    return notp.totp.gen(this.secret, opt);
  };

  this.verify = function(token, opt) {
    opt = opt || {};
    return notp.totp.verify(token, this.secret, opt);
  };
}

module.exports.TotpAuth = TotpAuth;

module.exports.generateSecret = randomBase32;
